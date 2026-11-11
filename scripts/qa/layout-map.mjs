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

// Runs in the page. Returns visible content items in document order.
function collect() {
  const SKIP = "header, nav, footer, [data-skip-map], .grecaptcha-badge, script, style, noscript, form *";
  const vw = window.innerWidth;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 8 && r.height > 8 && cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0.05;
  };
  const inChrome = (el) => !!el.closest(SKIP);
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const text = (el) => (el.innerText || "").replace(/\s+/g, " ").trim();
  const font = (el) => {
    // Style of the first visible text inside the element (spans can override the tag's font).
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
  const items = [];
  const all = document.body.querySelectorAll("h1,h2,h3,h4,p,li,img,a,button,[style*='background-image'],section,div");
  for (const el of all) {
    if (inChrome(el) || !visible(el)) continue;
    const tag = el.tagName.toLowerCase();
    if (/^h[1-4]$/.test(tag)) {
      const t = text(el);
      if (t) items.push({ kind: "heading", tag, text: t, ...box(el), ...font(el) });
    } else if (tag === "p" || tag === "li") {
      const t = text(el);
      if (t.length >= 20) items.push({ kind: "text", tag, text: t.slice(0, 80), ...box(el), ...font(el) });
    } else if (tag === "img") {
      const src = el.currentSrc || el.src || "";
      const b = box(el);
      // The top full-width photo is the hero, whether it is an <img>, an inline data URI or a background.
      const hero = b.y < 450 && b.w > vw * 0.6;
      if (!src.startsWith("data:") || el.width > 200) items.push({ kind: "image", src: hero ? "hero" : src.startsWith("data:") ? "data-uri" : src, ...b });
    } else if (tag === "a" || tag === "button") {
      const cs = getComputedStyle(el);
      const bg = cs.backgroundColor;
      const t = text(el);
      if (t && bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        items.push({ kind: "button", text: t.slice(0, 60), bg, radius: cs.borderRadius, ...box(el), ...font(el) });
      }
    } else {
      const bgi = getComputedStyle(el).backgroundImage;
      const m = bgi && bgi.match(/url\(["']?([^"')]+)["']?\)/);
      if (m && !m[1].startsWith("data:") && el.getBoundingClientRect().width > 120 && el.getBoundingClientRect().height > 80) {
        const b = box(el);
        items.push({ kind: "bgimage", src: b.y < 450 && b.w > vw * 0.6 ? "hero" : m[1], ...b });
      }
    }
  }
  // Section bands: full-width blocks with their own background color.
  const bands = [];
  for (const el of document.body.querySelectorAll("section, div, main > *")) {
    if (inChrome(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < vw - 4 || r.height < 80) continue;
    const bg = getComputedStyle(el).backgroundColor;
    const alpha = bg.startsWith("rgba") ? Number(bg.split(",")[3]) : 1;
    if (bg && alpha > 0.1) bands.push({ bg, ...box(el) });
  }
  const allText = (document.body.innerText || "").toLowerCase().replace(/[\u2018\u2019\u201c\u201d'"]/g, "").replace(/[^a-z0-9$]+/g, " ");
  return { vw, allText, docWidth: document.documentElement.scrollWidth, docHeight: document.documentElement.scrollHeight, items, bands };
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
        for (let y = 0; y < document.body.scrollHeight; y += 500) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(600);
      const map = await page.evaluate(collect);
      const dir = path.join(outDir, String(width));
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify({ url, width, ...map }, null, 1));
      console.log(`${width} ${slug} items=${map.items.length}`);
    } catch (err) {
      console.log(`${width} ${slug} ERROR ${err.message}`);
    }
  }
  await ctx.close();
}
await browser.close();
