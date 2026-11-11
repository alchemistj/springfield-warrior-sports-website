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
const only = (process.env.PAGES || "").split(",").filter(Boolean);
const pages = JSON.parse(readFileSync(new URL("../../source/pages.json", import.meta.url), "utf8")).filter(
  (p) => !only.length || only.includes(p.slug),
);
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
    if (r.top + window.scrollY >= document.documentElement.scrollHeight - 2) return false;
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) < 0.05) return false;
      // Clipped inside a scroller or overflow-hidden box (e.g. slider slides out of view).
      if (n !== el && /(hidden|clip|auto|scroll)/.test(cs.overflowX + cs.overflow)) {
        const pr = n.getBoundingClientRect();
        if (r.right <= pr.left + 2 || r.left >= pr.right - 2) return false;
      }
      if (n !== el && /(hidden|clip|auto|scroll)/.test(cs.overflowY + cs.overflow)) {
        const pr = n.getBoundingClientRect();
        if (r.bottom <= pr.top + 2 || r.top >= pr.bottom - 2) return false;
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
      spacing: cs.letterSpacing === "normal" ? 0 : Math.round(parseFloat(cs.letterSpacing) * 10) / 10,
      lh: cs.lineHeight === "normal" ? Math.round(parseFloat(cs.fontSize) * 1.2) : Math.round(parseFloat(cs.lineHeight)),
    };
  };
  // Style runs: every text node in the block with its own color and weight, consecutive equal
  // styles merged. Catches a missing colored link or a whole paragraph in the accent color.
  const runs = (el) => {
    const out = [];
    const walker = document.createTreeWalker(el, 4, { acceptNode: (n) => (n.textContent.trim() ? 1 : 3) });
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const cs = getComputedStyle(n.parentElement);
      const t = n.textContent.replace(/\s+/g, " ");
      const last = out[out.length - 1];
      // Underline comes from the nearest ancestor that sets it (text-decoration isn't inherited).
      let u = false;
      for (let a = n.parentElement; a && a !== el.parentElement; a = a.parentElement)
        if (getComputedStyle(a).textDecorationLine.includes("underline")) { u = true; break; }
      if (last && last.c === cs.color && last.w === Number(cs.fontWeight) && last.u === u) last.t += t;
      else out.push({ t, c: cs.color, w: Number(cs.fontWeight), u });
    }
    return out;
  };
  // Rendered line count (v2.6): distinct line tops of the text, so padding doesn't count.
  const lines = (el) => {
    const r = document.createRange();
    r.selectNodeContents(el);
    // v2.16: group rects into lines by vertical overlap, so a <br> or a nested span with another
    // font size on the same line doesn't count as an extra line.
    const rects = [...r.getClientRects()].filter((x) => x.width > 1 && x.height > 1).sort((a, b) => a.top - b.top);
    let n = 0, bottom = -Infinity;
    for (const x of rects) {
      const mid = x.top + x.height / 2;
      if (mid > bottom) { n++; bottom = x.bottom; } else bottom = Math.max(bottom, x.bottom);
    }
    return n;
  };
  // Background a visitor sees behind an element: the nearest ancestor with a solid color or an image.
  const behind = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== "none" && !cs.backgroundImage.startsWith("linear-gradient(rgba(0, 0, 0, 0)")) return "image";
      const bg = cs.backgroundColor;
      const alpha = bg.startsWith("rgba") ? Number(bg.split(",")[3]) : 1;
      if (alpha > 0.5) return bg;
    }
    return "rgb(255, 255, 255)";
  };
  const rgbaOf = (c) => { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(",").map(Number); return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1]; };
  // Solid fill of an element: its background color, or a one-colour linear-gradient (Thrive paints bands that way).
  const solidOf = (cs) => {
    const c = rgbaOf(cs.backgroundColor);
    if (c && c[3] >= 0.05) return c;
    const g = (cs.backgroundImage || "").match(/^linear-gradient\((rgba?\([^)]*\)), (rgba?\([^)]*\))\)$/);
    return g && g[1] === g[2] ? rgbaOf(g[1]) : null;
  };
  const paintedUnder = (el) => {
    const r0 = el.getBoundingClientRect();
    const y = r0.top + window.scrollY + Math.min(10, r0.height / 2);
    window.scrollTo(0, Math.max(0, y - vh / 2));
    const r = el.getBoundingClientRect();
    const stack = document.elementsFromPoint(r.left + Math.min(10, r.width / 2), r.top + Math.min(10, r.height / 2));
    const at = stack.indexOf(el);
    for (const n of stack.slice(at + 1)) {
      if (el.contains(n)) continue;
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== "none" && /url\(/.test(cs.backgroundImage)) return "image";
      const c = solidOf(cs);
      if (c && c[3] > 0.5) return `rgb(${c.slice(0, 3).join(", ")})`;
    }
    return "rgb(255, 255, 255)";
  };
  const boxShade = (el) => {
    const cs = getComputedStyle(el);
    const c = solidOf(cs);
    if (!c || c[3] < 0.05) return null;
    // What is painted under the box (the grey band can be a sibling layer, not a parent).
    const under = paintedUnder(el);
    const u = under === "image" ? null : rgbaOf(under);
    if (c[3] < 1 && !u) return null;
    const out = u ? [0, 1, 2].map((k) => Math.round(c[k] * c[3] + u[k] * (1 - c[3]))) : c.slice(0, 3);
    if (u && Math.max(...[0, 1, 2].map((k) => Math.abs(out[k] - u[k]))) < 6) return null;
    return `rgb(${out.join(", ")})`;
  };
  const region = (el) => (el.closest("header, [data-region=header], #tve_header_wrapper, .thrv_header") ? "header" : el.closest("footer, [data-region=footer], .thrv_footer, #tve_footer_wrapper") ? "footer" : "main");
  const INLINE = new Set(["inline", "contents"]);
  const items = [];
  const els = [];
  for (const el of document.body.querySelectorAll("*")) {
    const tag = el.tagName.toLowerCase();
    const isField = ["input", "select", "textarea"].includes(tag);
    // v2.17: form contents stay out of the text checks, but the fields themselves are measured.
    if (skipped(el) && !(isField && !el.closest("[data-skip-map], .grecaptcha-badge"))) continue;
    let item = null;
    if (/^h[1-6]$/.test(tag)) {
      const t = text(el);
      if (t) item = { kind: "heading", tag, text: t, ...font(el) };
    } else if (["input", "select", "textarea"].includes(tag) && !["hidden", "submit", "button"].includes((el.type || "").toLowerCase())) {
      // v2.16: form fields — type, size, background, border, radius, placeholder, font size.
      const cs = getComputedStyle(el);
      item = {
        kind: "field",
        type: tag === "input" ? (el.type || "text").toLowerCase() : tag,
        placeholder: el.getAttribute("placeholder") || "",
        bg: cs.backgroundColor,
        border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
        radius: cs.borderTopLeftRadius,
        size: Math.round(parseFloat(cs.fontSize)),
      };
    } else if (["td", "th", "li", "div", "p"].includes(tag)) {
      // v2.16: shaded boxes smaller than a band (table cells, cards): background color and size.
      // v2.17: the shade a visitor sees, including a flat translucent gradient (live camp dates
      // use linear-gradient(rgba(255,255,255,.42) ...) over the grey band), blended over what is
      // behind the box. Kept only when it differs from the background around it.
      const r = el.getBoundingClientRect();
      const shade = boxShade(el);
      if (shade && r.width >= 60 && r.width < vw * 0.9 && r.height >= 20 && r.height <= 400 && (el.innerText || "").trim() && shown(el))
        items.push({ kind: "box", bg: shade, text: (el.innerText || "").trim().slice(0, 40), region: region(el), ...box(el) }), els.push(el);
    }
    if (item) {
      // (fall through to the shared push below)
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
    if (item && (item.kind === "heading" || item.kind === "text")) { item.behind = behind(el); item.runs = runs(el); item.lines = lines(el); }
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
    // v2.8: sample the top, middle and bottom line, centred and near the left, not only the
    // middle (a heading box overlapping only the last line of the trust bar was missed).
    const xs = [r.left + Math.min(r.width / 2, 40), r.left + r.width / 2];
    const ys = [r.top + Math.min(8, r.height / 2), r.top + r.height / 2, r.bottom - Math.min(8, r.height / 2)];
    for (const x of xs) for (const y of ys) {
      if (it.covered) break;
      const cx = Math.min(vw - 1, Math.max(0, x));
      const cy = Math.min(vh - 1, Math.max(0, y));
      const hit = document.elementFromPoint(cx, cy);
      if (hit && !el.contains(hit) && !hit.contains(el)) {
        const hr = hit.getBoundingClientRect();
        // Ignore the sticky header and mobile bar sitting over content at the screen edges.
        const fixedAncestor = (() => { for (let n = hit; n; n = n.parentElement) if (["fixed", "sticky"].includes(getComputedStyle(n).position)) return true; return false; })();
        if (!fixedAncestor && hr.width > 20) it.covered = true;
      }
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
      // v2.7: hide fixed elements in the bottom half (mobile Call bar, reCAPTCHA badge) so a full-page screenshot
      // doesn't paint them over whatever content sits at that spot of the first screen.
      await page.addStyleTag({ content: "[data-qa-fixed]{visibility:hidden !important}" });
      await page.evaluate(() => {
        for (const el of document.body.querySelectorAll("*")) {
          if (getComputedStyle(el).position !== "fixed") continue;
          const r = el.getBoundingClientRect();
          if (r.top > window.innerHeight * 0.5) el.setAttribute("data-qa-fixed", ""); // bottom bars and badges only
        }
      });
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
