import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const pages = JSON.parse(readFileSync(new URL("../../source/pages.json", import.meta.url), "utf8"));
const base = process.env.BASE || "http://127.0.0.1:4322";
const widths = (process.env.W || "390,1440").split(",").map(Number);
const only = process.env.ROUTES ? process.env.ROUTES.split(",") : null;
const routes = only ? pages.filter((page) => only.includes(page.path)) : pages;

const browser = await chromium.launch();
let problems = 0;

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  console.log(`\n######## ${width}px ########`);
  for (const { path: route } of routes) {
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text().slice(0, 160));
    });
    await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.evaluate(async () => {
      const step = Math.max(400, window.innerHeight - 40);
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      window.scrollTo(0, 0);
    });
    const result = await page.evaluate(() => {
      const vw = window.innerWidth;
      const wide = [];
      const clipped = [];
      const h1s = [];
      const seen = new Set();
      for (const el of document.querySelectorAll("body *")) {
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden" || cs.position === "fixed") continue;
        if (el.closest(".hp, .sr-only")) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        if (r.right < 0 || r.left > vw) continue;
        if (r.right > vw + 1 || r.left < -1) {
          const key = `${el.tagName}.${String(el.className).slice(0, 48)}`;
          if (seen.has(key) || wide.length >= 8) continue;
          seen.add(key);
          const t = (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 48);
          wide.push(`${key} L${Math.round(r.left)} R${Math.round(r.right)} W${Math.round(r.width)} "${t}"`);
        }
      }
      const buttons = document.querySelectorAll("a.btn, button.btn, .b3-btn, .go, .b4-visit, .comp-btn, .cta-phone, .final-cta a, [data-add], .btn-line");
      for (const el of buttons) {
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        if (el.scrollWidth > el.clientWidth + 1) {
          clipped.push(`"${(el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 72)}" scroll ${el.scrollWidth} client ${el.clientWidth}`);
        }
      }
      for (const el of document.querySelectorAll("h1")) {
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) continue;
        const left = Math.round(r.left);
        const right = Math.round(vw - r.right);
        h1s.push(`${left < 16 || right < 16 ? "EDGE " : ""}L${left} R${right} "${(el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 64)}"`);
      }
      return { scroll: document.documentElement.scrollWidth, wide, clipped, h1s };
    });
    page.removeAllListeners("console");
    const bad = result.wide.length || result.clipped.length || result.h1s.some((line) => line.startsWith("EDGE")) || result.scroll > width + 1;
    if (bad) problems += 1;
    console.log(`\n${width} ${route} scroll=${result.scroll}${bad ? " FAIL" : " OK"}`);
    if (result.wide.length) console.log("  WIDE\n    " + result.wide.join("\n    "));
    if (result.clipped.length) console.log("  CLIP\n    " + result.clipped.join("\n    "));
    if (result.h1s.length) console.log("  H1\n    " + result.h1s.join("\n    "));
    if (errors.length) console.log("  CONSOLE " + [...new Set(errors)].slice(0, 3).join(" | "));
  }
  await page.close();
}
console.log(`\n${problems} page-widths with problems`);
await browser.close();
process.exit(problems ? 1 : 0);
