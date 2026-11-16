// Paragraph checks for a rebuild (Rule 4 typography, Rule 0.4 keeps the human work).
//
// 1. Length: every body paragraph renders at most 4 lines at 1440 (Rule 4: paragraphs 3-4 lines max).
//    A paragraph that is a single sentence is reported but does not fail: it cannot split without changing words.
//    390 is reported too, for information: 4 lines there is about 30 words, so it does not fail the check.
// 2. Parity: every paragraph on the live site (from the saved capture in source/pages/<slug>/rendered.html)
//    is its own paragraph in the build. A live <p> split by a blank line (<br><br>) counts as separate
//    paragraphs. A live paragraph may be split into consecutive build paragraphs (allowed when it would
//    break the 4-line max), but only between sentences: each part but the last must end a sentence.
//    It must never be merged into a longer paragraph, and never dropped.
//
// Ignored live text: Gravity Forms' required-fields note (inside the form), the Meet the Team title (a <p> on live,
// the H1 in the build) and the competitions early-bird sentence live hides with font-size 0.
//
// Usage: node scripts/qa/paragraphs.mjs <build-base-url> [out.md]
//   PAGES=home,about limits the pages. Exit code 1 when any check fails.
import { chromium } from "playwright";
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const [base, outFile = "paragraph-report.md"] = process.argv.slice(2);
if (!base) { console.error("usage: node scripts/qa/paragraphs.mjs <build-base-url> [out.md]"); process.exit(2); }
const only = (process.env.PAGES || "").split(",").filter(Boolean);
// Josh, 16 Nov 2026: the 2024 Summer Fun thank-you page is removed. Both slash forms
// 301 to /competitions/. Dropped from source/pages.json so page-driven checks do not request it.
const RETIRED = new Set(["registered-for-summer-fun-competition"]);
const slugs = readdirSync("source/pages").filter((s) => !RETIRED.has(s) && existsSync(path.join("source/pages", s, "rendered.html")) && (!only.length || only.includes(s)));
const MAX_LINES = 4;
const MIN_CHARS = 25; // shorter fragments are labels, not paragraphs

// Runs in the page: the paragraphs of the main content, split on blank lines (<br><br>).
function collect({ maxLines, withReviews }) {
  const CHROME = "header, footer, nav, form, [data-region=header], [data-region=footer], #tve_header_wrapper, #tve_footer_wrapper, .thrv_header, .thrv_footer, .site-header, .site-footer, .trust-bar, [data-skip-paragraphs]";
  // Reviews are customers' words: they count for parity (not dropped or merged) but not for the length rule.
  const SKIP = withReviews ? CHROME : CHROME + ", .review-band, .b2-quotes, .quote, blockquote, [class*=review], [class*=testimonial]";
  const norm = (t) => t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  const out = [];
  for (const p of document.querySelectorAll("p")) {
    if (p.closest(SKIP)) continue;
    const cs = getComputedStyle(p);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    // Split on two or more <br> in a row (a blank line in the copy).
    const parts = [];
    let cur = "";
    let brRun = 0;
    const walk = (node) => {
      for (const n of node.childNodes) {
        if (n.nodeType === 3) { if (n.textContent.trim()) brRun = 0; cur += n.textContent; }
        else if (n.nodeName === "BR") { brRun++; if (brRun >= 2) { parts.push(cur); cur = ""; } else cur += " "; }
        else { brRun = 0; walk(n); }
      }
    };
    walk(p);
    parts.push(cur);
    // Line count of the whole <p> as rendered (rects grouped by vertical position).
    let lines = 0;
    if (maxLines) {
      const range = document.createRange();
      range.selectNodeContents(p);
      const tops = [...range.getClientRects()].filter((r) => r.width > 2 && r.height > 2).map((r) => Math.round(r.top + r.height / 2));
      const uniq = [];
      for (const t of tops.sort((a, b) => a - b)) if (!uniq.length || t - uniq[uniq.length - 1] > 4) uniq.push(t);
      lines = uniq.length;
    }
    for (const part of parts) {
      const t = norm(part);
      if (t.length >= 25) out.push({ text: t, lines: parts.length > 1 ? null : lines });
    }
  }
  // The booking page shows the same three steps as a list. The words still count as that one paragraph.
  for (const list of document.querySelectorAll("ol.book-steps")) {
    if (list.closest(SKIP)) continue;
    const cs = getComputedStyle(list);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const text = norm([...list.querySelectorAll("li")].map((li) => li.textContent || "").join(" "));
    if (text.length >= 25) out.push({ text, lines: list.querySelectorAll("li").length });
  }
  return out;
}

const browser = await chromium.launch();
const rows = [];
const pending = []; // [slug, live paragraph] not found on its own page; checked site-wide at the end
const allBuild = new Set();
let fails = 0;
for (const slug of slugs) {
  // Live paragraphs from the saved capture (no network: scripts and styles are not needed for text).
  const live = await browser.newPage();
  await live.route("**/*", (r) => r.abort());
  await live.setContent(readFileSync(path.join("source/pages", slug, "rendered.html"), "utf8"), { waitUntil: "domcontentloaded" }).catch(() => {});
  const IGNORE = [/indicates required fields/i, /^Meet The Springfield Warrior Sports Team$/i, /early bird price for the January 13th/i,
    // Josh, 15 Nov 2026: the day-camps-for-school-breaks offer is removed until the client confirms it still runs.
    /^Elevate your children's school break/i,
    // Live breaks one best-gyms sentence across three lines; the build joins it back into one sentence (same words).
    /^Instead, think obstacle courses, warped walls/i, /^and train like never before, check out our Adult Fitness/i, /^one of the most unique gyms around\. We/i,
    // Josh, 16 Nov 2026: the 26 Oct 2024 WNL qualifier (price, deadline, and dated form) is off until the next dates are set.
    /^Early bird pricing for these competitions is \$55/i,
    /^Don't wait to register - The early bird price for the October 26th/i,
    /^Registration is easy and happens in two steps/i,
    /^Fill out your information using the form below then/i,
    /^Pay your registration fee using the pay link/i,
    // Josh, 16 Nov 2026: the 19 Sep 2026 CSNA block, its price, and its registration form are off until the next dates are set.
    /^Date: Saturday, September 19th/i,
    /^Start time: TBA/i,
    /^Price per registration/i,
    /^September 2026 CSNA/i,
    // Josh, 16 Nov 2026: the 2026 summer camp week list and registration form are off. Summer 2027 dates come in the spring.
    /^May 25th - May 29th/i,
    /^June 8th - June 12th/i,
    /^June 22nd - June 26th/i,
    /^July 6th - July 10th/i,
    /^July 20th - July 24th/i,
    /^August 3rd - August 7th/i,
    /^August 17th - August 21st/i,
    /^8:30 AM - 11:30 AM$/i,
    /^12 PM - 3 PM$/i,
    /^Sign up by filling out the registration form below/i,
    // Josh, 16 Nov 2026: the No-School Day Camp card is off kids classes until the client confirms that offer.
    /^Give your kids active, exciting days during school break at our fun day camps/i,
    /^We provide both half-day and full-days camp options/i];
  const liveParas = (await live.evaluate(collect, { maxLines: 0, withReviews: true })).filter((l) => !IGNORE.some((re) => re.test(l.text)));
  await live.close();

  const url = `${base.replace(/\/$/, "")}/${slug === "home" ? "" : slug + "/"}`;
  const byWidth = {};
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    await p.goto(url, { waitUntil: "networkidle" });
    byWidth[w] = await p.evaluate(collect, { maxLines: MAX_LINES, withReviews: false });
    if (w === 1440) byWidth.parity = await p.evaluate(collect, { maxLines: 0, withReviews: true });
    await p.close();
  }
  const build = byWidth.parity;
  const buildTexts = build.map((b) => b.text);
  buildTexts.forEach((t) => allBuild.add(t));
  const issues = [];
  const notes = [];

  // Parity
  for (const lp of liveParas) {
    if (buildTexts.includes(lp.text)) continue;
    let split = null;
    for (let i = 0; i < buildTexts.length && !split; i++) {
      let acc = buildTexts[i];
      for (let j = i + 1; j < buildTexts.length && acc.length < lp.text.length; j++) {
        acc += " " + buildTexts[j];
        if (acc === lp.text) { split = buildTexts.slice(i, j + 1); break; }
      }
    }
    if (split) {
      // A split must fall between sentences: every part but the last ends with . ! or ? (closing quotes allowed),
      // and the next part starts a new sentence, not a lowercase word.
      // A next part that starts in lowercase continues the sentence (e.g. a split after "Mo.").
      split.slice(0, -1).forEach((part, k) => {
        const next = split[k + 1];
        if (!/[.!?]["'”’)]*$/.test(part) || /^[a-z]/.test(next)) issues.push(`split mid-sentence: "…${part.slice(-50)}" / "${next.slice(0, 40)}…"`);
      });
      continue;
    }
    const host = buildTexts.find((b) => b.includes(lp.text));
    if (host) issues.push(`merged: "${lp.text.slice(0, 70)}…" is inside a longer build paragraph ("${host.slice(0, 50)}…")`);
    else pending.push([slug, lp.text, issues]);
  }
  // Length
  for (const w of [1440, 390]) {
    for (const b of byWidth[w]) {
      if (!(b.lines && b.lines > MAX_LINES)) continue;
      // One sentence on its own cannot be split without changing words: report it, do not fail.
      // A period before a lowercase word is not a new sentence (the same rule as a split after "Mo.").
      const oneSentence = !/[.!?]["'”’)]*\s+[A-Z0-9“"'(]/.test(b.text);
      if (w === 1440 && oneSentence) notes.push(`${w}px (one sentence, cannot split): ${b.lines} lines: "${b.text.slice(0, 60)}…"`);
      else if (w === 1440) issues.push(`${w}px: ${b.lines} lines (max ${MAX_LINES}): "${b.text.slice(0, 70)}…"`);
      else notes.push(`${w}px (info only): ${b.lines} lines: "${b.text.slice(0, 60)}…"`);
    }
  }
  fails += issues.length;
  rows.push(`## ${slug}: ${issues.length ? issues.length + " issue(s)" : "passes"}\n${issues.map((i) => `- ${i}`).join("\n")}${notes.length ? "\n" + notes.map((n) => `- ${n}`).join("\n") : ""}`);
}
await browser.close();
// A paragraph moved to another page (reviews spread across pages) still counts; one found nowhere is missing.
for (const [slug, text, issues] of pending) {
  if (allBuild.has(text)) continue;
  issues.push(`missing as its own paragraph: "${text.slice(0, 80)}…"`);
  fails++;
  const i = rows.findIndex((r) => r.startsWith(`## ${slug}:`));
  rows[i] = `## ${slug}: ${issues.length} issue(s)\n${issues.map((x) => `- ${x}`).join("\n")}`;
}
writeFileSync(outFile, `# Paragraph checks on ${base}\n\nTotal issues: ${fails}\n\n${rows.join("\n\n")}\n`);
console.log(`Total issues: ${fails}`);
for (const r of rows) console.log(r.split("\n")[0]);
process.exit(fails ? 1 : 0);
