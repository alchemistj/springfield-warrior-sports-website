// Records what a visitor sees on a page, in order: headings, paragraphs, images and buttons,
// with position, size, font and color, at a given viewport width.
// Used to compare the live WordPress site with the Astro build (see compare-layout.mjs).
//
// Usage: node scripts/qa/layout-map.mjs <baseUrl> <outDir> [width ...]
//   e.g. node scripts/qa/layout-map.mjs https://www.springfieldwarriorsports.com docs/qa/layout-map/live 1920 1280 390
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";

const [base, outDir, ...widthArgs] = process.argv.slice(2);
if (!base || !outDir) {
  console.error("usage: layout-map.mjs <baseUrl> <outDir> [width ...]");
  process.exit(2);
}
const widths = (widthArgs.length ? widthArgs : ["1920", "1280", "390"]).map(Number);
const pages = JSON.parse(readFileSync(new URL("../../source/pages.json", import.meta.url), "utf8"));
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

// Runs in the page. Returns what a visitor can actually see, in document order.
// Header and footer are included. Items scrolled off to the side (hidden slides), invisible,
// or covered by another element are marked, so hidden content can't count as "present".
function collect() {
  const SKIP = "[data-skip-map], .grecaptcha-badge, script, style, noscript, form *";
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const skipped = (el) => !!el.closest(SKIP);
  const shown = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width <= 4 || r.height <= 4 || r.right <= 0 || r.left >= vw || r.bottom + window.scrollY <= 0) return false;
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) < 0.05) return false;
      // Clipped inside a scroller or overflow-hidden box (e.g. slider slides out of view).
      if (n !== el && /(hidden|clip|auto|scroll)/.test(cs.overflowX + cs.overflow)) {
        const pr = n.getBoundingClientRect();
        if (r.right <= pr.left + 2 || r.left >= pr.right - 2) return false;
      }
    }
    return true;
  };
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const text = (el) => (el.innerText || "").replace(/\s+/g, " ").trim();
  const ownText = (el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" ").replace(/\s+/g, " ").trim();
  const font = (el) => {
    const walker = document.createTreeWalker(el, 4 /* NodeFilter.SHOW_TEXT */, { acceptNode: (n) => (n.textContent.trim() ? 1 : 3) });
    const first = walker.nextNode();
    const cs = getComputedStyle(first && first.parentElement ? first.parentElement : el);
    return {
      family: cs.fontFamily.split(",")[0].replace(/["']/g, "").trim(),
      size: Math.round(parseFloat(cs.fontSize)),
      weight: Number(cs.fontWeight),
      color: cs.color,
      align: cs.textAlign,
      transform: cs.textTransform,
    };
  };
  const region = (el) => (el.closest("header, [data-region=header], #tve_header_wrapper, .thrv_header") ? "header" : el.closest("footer, [data-region=footer], .thrv_footer, #tve_footer_wrapper") ? "footer" : "main");
  const INLINE = new Set(["inline", "contents"]);
  const items = [];
  const els = [];
  for (const el of document.body.querySelectorAll("*")) {
    if (skipped(el)) continue;
    const tag = el.tagName.toLowerCase();
    let item = null;
    if (/^h[1-6]$/.test(tag)) {
      const t = text(el);
      if (t) item = { kind: "heading", tag, text: t, ...font(el) };
    } else if (tag === "img") {
      const src = el.currentSrc || el.src || "";
      const r = el.getBoundingClientRect();
      const hero = r.top + window.scrollY < 450 && r.width > vw * 0.6;
      if (!src.startsWith("data:") || r.width > 200) item = { kind: "image", src: hero ? "hero" : src.startsWith("data:") ? "data-uri" : src };
    } else if (tag === "svg") {
      const r = el.getBoundingClientRect();
      if (r.width >= 8 && r.width <= 72 && r.height >= 8 && r.height <= 72) {
        const cs = getComputedStyle(el);
        item = { kind: "icon", color: cs.fill && cs.fill !== "none" ? cs.fill : cs.color };
      }
    } else if ((tag === "a" || tag === "button") && text(el)) {
      const cs = getComputedStyle(el);
      const alpha = cs.backgroundColor.startsWith("rgba") ? Number(cs.backgroundColor.split(",")[3]) : 1;
      if (alpha > 0.1) item = { kind: "button", text: text(el).slice(0, 60), bg: cs.backgroundColor, radius: cs.borderRadius, ...font(el) };
      else if (region(el) !== "main" && !el.querySelector("img,svg")) item = { kind: "text", tag: "a", text: text(el).slice(0, 80), ...font(el) };
    }
    if (!item && !/^h[1-6]$/.test(tag) && !el.closest("h1,h2,h3,h4,h5,h6,a,button")) {
      // A text block: a block-level element with text and no block-level child that has text.
      const disp = getComputedStyle(el).display;
      const t = text(el);
      if (t.length >= 3 && !INLINE.has(disp) && !["svg", "img", "path"].includes(tag)) {
        const hasBlockChildWithText = [...el.children].some(
          (c) => !INLINE.has(getComputedStyle(c).display) && (c.innerText || "").trim().length > 0,
        );
        if (!hasBlockChildWithText && (ownText(el).length > 0 || el.querySelector("strong,b,em,i,span,a"))) {
          item = { kind: "text", tag, text: t.slice(0, 80), full: t.slice(0, 3000), ...font(el) };
        }
      }
    }
    if (!item) {
      const bgi = getComputedStyle(el).backgroundImage;
      const m = bgi && bgi.match(/url\(["']?([^"')]+)["']?\)/);
      const r = el.getBoundingClientRect();
      if (m && !m[1].startsWith("data:") && r.width > 120 && r.height > 80) {
        const hero = r.top + window.scrollY < 450 && r.width > vw * 0.6;
        item = { kind: "bgimage", src: hero ? "hero" : m[1] };
      }
    }
    if (item && shown(el)) {
      items.push({ ...item, region: region(el), ...box(el) });
      els.push(el);
    }
  }
  // Covered check: scroll each text/heading/button into the middle of the screen and ask the
  // browser what is on top at its centre.
  items.forEach((it, i) => {
    if (!["heading", "text", "button"].includes(it.kind)) return;
    const el = els[i];
    window.scrollTo(0, Math.max(0, it.y + it.h / 2 - vh / 2));
    const r = el.getBoundingClientRect();
    const cx = Math.min(vw - 1, Math.max(0, r.left + Math.min(r.width / 2, 40)));
    const cy = Math.min(vh - 1, Math.max(0, r.top + r.height / 2));
    const hit = document.elementFromPoint(cx, cy);
    if (hit && !el.contains(hit) && !hit.contains(el)) {
      const hr = hit.getBoundingClientRect();
      // Ignore the sticky header and mobile bar sitting over content at the screen edges.
      const fixedAncestor = (() => { for (let n = hit; n; n = n.parentElement) if (["fixed", "sticky"].includes(getComputedStyle(n).position)) return true; return false; })();
      if (!fixedAncestor && hr.width > 20) it.covered = true;
    }
  });
  window.scrollTo(0, 0);
  const bands = [];
  for (const el of document.body.querySelectorAll("section, div, main > *, header, footer")) {
    if (skipped(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < vw - 4 || r.height < 30) continue;
    const bg = getComputedStyle(el).backgroundColor;
    const alpha = bg.startsWith("rgba") ? Number(bg.split(",")[3]) : 1;
    if (bg && alpha > 0.1) bands.push({ bg, ...box(el) });
  }
  // Text in the page that a visitor can't see (hidden attribute, display:none, visibility:hidden).
  const hiddenText = [];
  for (const el of document.body.querySelectorAll("p, li, h1, h2, h3, h4, h5, h6, div")) {
    if (skipped(el)) continue;
    const t = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (t.length < 20 || el.querySelector("p, li, h1, h2, h3, h4, h5, h6")) continue;
    const cs = getComputedStyle(el);
    if (el.hidden || cs.display === "none" || cs.visibility === "hidden") hiddenText.push(t.slice(0, 200));
  }
  return { vw, hiddenText, docWidth: document.documentElement.scrollWidth, docHeight: document.documentElement.scrollHeight, items, bands };
}

const browser = await chromium.launch();
for (const width of widths) {
  const ctx = await browser.newContext({ userAgent: UA, viewport: { width, height: width < 600 ? 844 : 1000 } });
  const page = await ctx.newPage();
  for (const { path: route, slug } of pages) {
    const url = base.replace(/\/$/, "") + route;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
      await page.evaluate(async () => {
        // Slow enough for lazy-loaded sections on the live site to render (300px steps, 150ms).
        for (let y = 0; y < document.body.scrollHeight; y += 300) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 150));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1500);
      const map = await page.evaluate(collect);
      const dir = path.join(outDir, String(width));
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: path.join(dir, `${slug}.png`), fullPage: true });
      writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify({ url, width, ...map }, null, 1));
      console.log(`${width} ${slug} items=${map.items.length}`);
    } catch (err) {
      console.log(`${width} ${slug} ERROR ${err.message}`);
    }
  }
  await ctx.close();
}
await browser.close();
