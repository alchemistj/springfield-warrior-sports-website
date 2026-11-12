import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const pages = JSON.parse(readFileSync(new URL("../../source/pages.json", import.meta.url), "utf8"));
const base = process.env.BASE || "http://127.0.0.1:4322";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const problems = [];

for (const { path: route, slug } of pages) {
  await page.goto(base + route, { waitUntil: "networkidle", timeout: 120000 });
  const result = await page.evaluate(() => {
    const vw = window.innerWidth;
    const left = (vw - 900) / 2;
    const right = left + 900;
    const flags = [];
    const scroll = document.documentElement.scrollWidth - vw;
    if (scroll > 1) flags.push(`horizontal scroll ${document.documentElement.scrollWidth}`);

    const wrappers = [...document.querySelectorAll(".wrap, .b2-wrap, .b3-wrap, .b4-wrap, .hero-text, .bar, .foot, .final-inner, .review-inner, .copy-bar p")];
    for (const el of wrappers) {
      const r = el.getBoundingClientRect();
      if (r.width < 20 || r.height < 8) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const dx = Math.round(r.left - left);
      const dw = Math.round(r.width - 900);
      if (Math.abs(dx) > 2 || Math.abs(dw) > 2) {
        flags.push(`wrap ${el.className.toString().slice(0, 40)} x=${Math.round(r.left)} w=${Math.round(r.width)} dx=${dx} dw=${dw}`);
      }
    }

    // Readable blocks that stick out past the column, ignoring full-bleed backgrounds and hero photos.
    const nodes = document.querySelectorAll("h1,h2,h3,h4,p,li,a,img,button");
    for (const el of nodes) {
      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 8) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) < 0.05) continue;
      if (el.tagName === "IMG" && r.width > vw * 0.7) continue;
      if (r.width > vw - 8) continue;
      if (el.classList.contains("skip-link") || r.bottom < 0) continue;
      const pastLeft = r.left < left - 2;
      const pastRight = r.right > right + 2;
      if (pastLeft || pastRight) {
        const t = (el.innerText || el.getAttribute("alt") || el.tagName).replace(/\s+/g, " ").trim().slice(0, 48);
        flags.push(`out ${el.tagName} "${t}" x=${Math.round(r.left)} r=${Math.round(r.right)} w=${Math.round(r.width)}`);
      }
    }
    return { flags: [...new Set(flags)].slice(0, 24) };
  });
  if (result.flags.length) {
    problems.push({ slug, flags: result.flags });
    console.log(`\n${slug}`);
    for (const flag of result.flags) console.log("  " + flag);
  } else {
    console.log(`${slug} OK`);
  }
}
console.log(`\n${problems.length} pages with edge problems`);
await browser.close();
