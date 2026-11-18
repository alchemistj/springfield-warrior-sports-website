// At 390px every img must sit inside the 24px gutters (left 24, right 366).
// Usage: node scripts/qa/image-column.mjs [base-url]
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const base = (process.argv[2] || "http://127.0.0.1:4321").replace(/\/$/, "");
const pages = JSON.parse(readFileSync(new URL("../../source/pages.json", import.meta.url), "utf8"));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
let fails = 0;

for (const { path: route, slug } of pages) {
  await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 120000 });
  const flags = await page.evaluate(() => {
    const style = document.createElement("style");
    style.textContent = ".section,.b2-block,.b3,.b4{content-visibility:visible !important;contain-intrinsic-size:none !important;}";
    document.head.appendChild(style);
    const gutter = 24;
    const limit = window.innerWidth - gutter;
    const out = [];
    for (const img of document.querySelectorAll("img")) {
      const cs = getComputedStyle(img);
      if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) < 0.05) continue;
      // Edge-to-edge hero photographs match live. Every other image stays in the column.
      if (img.closest(".atf-photo, .b4-team-hero, .b4-gym-hero")) continue;
      const rect = img.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      let box = { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      let node = img.parentElement;
      let clippedAway = false;
      while (node && node !== document.body) {
        const pcs = getComputedStyle(node);
        if (pcs.overflow !== "visible" || pcs.overflowX !== "visible") {
          const pr = node.getBoundingClientRect();
          box = {
            left: Math.max(box.left, pr.left),
            right: Math.min(box.right, pr.right),
            top: Math.max(box.top, pr.top),
            bottom: Math.min(box.bottom, pr.bottom),
          };
          if (box.right - box.left < 2 || box.bottom - box.top < 2) clippedAway = true;
        }
        node = node.parentElement;
      }
      if (clippedAway) continue;
      const width = box.right - box.left;
      if (box.left < gutter - 1 || box.right > limit + 1 || width > limit - gutter + 1) {
        const src = (img.currentSrc || img.getAttribute("src") || "").split("/").pop() || "";
        out.push(`x=${Math.round(box.left)} r=${Math.round(box.right)} w=${Math.round(width)} ${src.slice(0, 60)}`);
      }
    }
    return out;
  });
  if (flags.length) {
    fails += flags.length;
    console.log(`\n${slug}`);
    for (const flag of flags) console.log("  " + flag);
  } else {
    console.log(`${slug} OK`);
  }
}

await browser.close();
console.log(`\n${fails} image${fails === 1 ? "" : "s"} outside the 24px column`);
process.exit(fails ? 1 : 0);
