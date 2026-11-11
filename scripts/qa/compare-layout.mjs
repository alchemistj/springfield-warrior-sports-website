// Compares layout maps of the live site and the build (from layout-map.mjs) and lists every
// difference a visitor would notice: missing or extra headings, photos and buttons, wrong order,
// wrong position or width (content column), wrong font, size, weight or color, wrong band colors,
// and horizontal scroll.
//
// Usage: node scripts/qa/compare-layout.mjs <liveDir> <buildDir> <reportFile> [--allow allow.json]
// Exit code 1 when any difference remains.
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const [liveDir, buildDir, reportFile] = args;
const allowIdx = args.indexOf("--allow");
const allow = allowIdx > -1 ? JSON.parse(readFileSync(args[allowIdx + 1], "utf8")) : [];

const TOL = { x: 24, wPct: 0.12, wAbs: 40, size: 2, weight: 100, color: 6 }; // color 6 (v2.5): live's light grey band is 14 off white

const norm = (s) => (s || "").toLowerCase().replace(/[‘’“”'"]/g, "").replace(/[^a-z0-9$]+/g, " ").trim();
export function imageKey(src) {
  if (!src || src === "data-uri") return src;
  let b = decodeURIComponent(src.split("?")[0].split("/").pop() || "");
  b = b.toLowerCase();
  for (let i = 0; i < 3; i++) b = b.replace(/\.(webp|jpe?g|png|gif|avif|svg)$/, "");
  b = b.split(".")[0]; // astro hash
  b = b.replace(/^\d{4}-\d{2}-/, "").replace(/-\d+x\d+$/, "").replace(/-scaled$/, "").replace(/-\d+x\d+$/, "");
  return b;
}
// rgb values with any alpha blended over white, so rgba(0, 0, 0, 0.7) reads as grey, not black.
const parseColor = (c) => {
  const v = (c?.match(/[\d.]+/g) || []).map(Number);
  const a = v.length >= 4 ? v[3] : 1;
  return v.slice(0, 3).map((x) => Math.round(x * a + 255 * (1 - a)));
};
const colorDiff = (a, b) => {
  const [x, y] = [parseColor(a), parseColor(b)];
  if (x.length < 3 || y.length < 3) return a === b ? 0 : 999;
  return Math.max(...x.map((v, i) => Math.abs(v - y[i])));
};
const widthOff = (a, b) => Math.abs(a - b) > Math.max(TOL.wAbs, a * TOL.wPct);

function matchSeq(live, build, keyFn) {
  // Greedy in-order match by key; returns pairs, missing, extra, outOfOrder.
  const used = new Set();
  const pairs = [];
  const missing = [];
  let lastIdx = -1;
  const outOfOrder = [];
  for (const l of live) {
    const k = keyFn(l);
    let idx = build.findIndex((b, i) => !used.has(i) && keyFn(b) === k);
    if (idx === -1) {
      missing.push(l);
      continue;
    }
    used.add(idx);
    if (idx < lastIdx) outOfOrder.push(l);
    lastIdx = Math.max(lastIdx, idx);
    pairs.push([l, build[idx]]);
  }
  const extra = build.filter((_, i) => !used.has(i));
  return { pairs, missing, extra, outOfOrder };
}

function matchHeadings(live, build) {
  // A live heading matches a build heading with the same text, or one that contains it in order
  // (a two-tone heading can be two tags on live and one tag with spans in the build).
  const usedBuild = new Set();
  const pairs = [], missing = [], outOfOrder = [];
  let cursor = 0, last = -1;
  for (const l of live) {
    const k = norm(l.text);
    let idx = build.findIndex((b, i) => i >= cursor && norm(b.text) === k);
    if (idx === -1) idx = build.findIndex((b, i) => i >= cursor && norm(b.text).includes(k));
    if (idx === -1) idx = build.findIndex((b) => norm(b.text) === k || norm(b.text).includes(k));
    if (idx === -1) { missing.push(l); continue; }
    if (idx < last) outOfOrder.push(l);
    last = Math.max(last, idx);
    if (norm(build[idx].text) === k) cursor = idx + 1; else cursor = idx;
    usedBuild.add(idx);
    if (norm(build[idx].text) === k) pairs.push([l, build[idx]]);
    else pairs.push([l, { ...build[idx], w: l.w, size: l.size, weight: l.weight, color: l.color }]); // position/font only
  }
  const extra = build.filter((b, i) => !usedBuild.has(i) && !live.some((l) => norm(b.text).includes(norm(l.text))));
  return { pairs, missing, extra, outOfOrder };
}

let CUR_VW = 9999; // set per page
function styleDiffs(l, b, label) {
  const out = [];
  // v2.6: phone widths get a tighter left-edge limit (a 6px gutter change rewraps text at 390).
  const xTol = CUR_VW <= 480 ? 4 : TOL.x;
  if (Math.abs(l.x - b.x) > xTol) out.push(`${label}: left edge ${b.x}px, live ${l.x}px`);
  if (widthOff(l.w, b.w)) out.push(`${label}: width ${b.w}px, live ${l.w}px`);
  if (l.family && b.family && l.family.toLowerCase() !== b.family.toLowerCase()) out.push(`${label}: font ${b.family}, live ${l.family}`);
  if (l.size && Math.abs(l.size - b.size) > TOL.size) out.push(`${label}: size ${b.size}px, live ${l.size}px`);
  if (l.weight && Math.abs(l.weight - b.weight) >= TOL.weight) out.push(`${label}: weight ${b.weight}, live ${l.weight}`);
  if (l.color && colorDiff(l.color, b.color) > TOL.color) out.push(`${label}: color ${b.color}, live ${l.color}`);
  // Line count (v2.5): same words wrapping onto a different number of lines (only when the
  // text is identical, so a paragraph split differently isn't flagged).
  if (l.lh && b.lh && l.h && b.h && norm(l.full || l.text) === norm(b.full || b.text)) {
    // v2.6: rendered line count when both sides have it (box height includes padding).
    const ln = l.lines ?? Math.round(l.h / l.lh), bn = b.lines ?? Math.round(b.h / b.lh);
    if (ln !== bn) out.push(`${label}: ${bn} line(s), live ${ln}`);
  }
  if (l.lh && b.lh && Math.abs(l.lh - b.lh) > 2) out.push(`${label}: line height ${b.lh}px, live ${l.lh}px`);
  if (l.spacing !== undefined && b.spacing !== undefined && Math.abs(l.spacing - b.spacing) > 0.2)
    out.push(`${label}: letter spacing ${b.spacing}px, live ${l.spacing}px`);
  if (l.align && b.align && l.align !== b.align && !(l.align === "start" && b.align === "left") && !(l.align === "left" && b.align === "start"))
    out.push(`${label}: align ${b.align}, live ${l.align}`);
  return out;
}

// Background and band colors from the screenshot (v2.5: was 40, missed a 14-off light grey band).
const BG_TOL = 8;
const PIXEL_TOL = 38; // mean absolute difference (0-255) over a 48x16 grayscale thumbnail of the region
const pngMeta = new Map();
async function meta(file) {
  if (!pngMeta.has(file)) pngMeta.set(file, await sharp(file).metadata());
  return pngMeta.get(file);
}
async function thumb(file, r) {
  const m = await meta(file);
  const left = Math.max(0, Math.min(m.width - 2, r.x));
  const top = Math.max(0, Math.min(m.height - 2, r.y));
  const width = Math.max(1, Math.min(m.width - left, r.w));
  const height = Math.max(1, Math.min(m.height - top, r.h));
  if (width < 8 || height < 8) return null;
  return sharp(file).extract({ left, top, width, height }).resize(48, 16, { fit: "fill" }).grayscale().raw().toBuffer();
}
async function brightness(file, r) {
  const t = await thumb(file, r);
  if (!t) return null;
  let sum = 0;
  for (const v of t) sum += v;
  return sum / t.length;
}
async function dominant(file, r, padding = 12) {
  const m = await meta(file);
  const pad = padding;
  const left = Math.round(Math.max(0, Math.min(m.width - 2, r.x - pad)));
  const top = Math.round(Math.max(0, Math.min(m.height - 2, r.y - pad)));
  const width = Math.round(Math.max(1, Math.min(m.width - left, r.w + pad * 2)));
  const height = Math.round(Math.max(1, Math.min(m.height - top, r.h + pad * 2)));
  if (width < 2 || height < 2) return null;
  const buf = await sharp(file).extract({ left, top, width, height }).resize(40, 12, { fit: "fill", kernel: "nearest" }).removeAlpha().raw().toBuffer();
  // Most common color bucket, then the true average of the pixels in it (v2.5: returning the
  // bucket itself rounded white to 264 and flipped near-black between 0 and 24).
  const counts = new Map();
  for (let i = 0; i < buf.length; i += 3) {
    const key = [buf[i], buf[i + 1], buf[i + 2]].map((v) => Math.round(v / 24)).join(",");
    const e = counts.get(key) || { n: 0, sum: [0, 0, 0] };
    e.n++;
    for (let k = 0; k < 3; k++) e.sum[k] += buf[i + k];
    counts.set(key, e);
  }
  const [best] = [...counts.values()].sort((a, b) => b.n - a.n);
  return best.sum.map((v) => Math.round(v / best.n));
}
async function regionDiff(liveFile, l, buildFile, b) {
  const [a, c] = await Promise.all([thumb(liveFile, l), thumb(buildFile, b)]);
  if (!a || !c) return null;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - c[i]);
  return sum / a.length;
}

const allowed = (slug, width, line) =>
  allow.some((a) => (a.page === "*" || a.page === slug) && (!a.width || a.width === width) && line.includes(a.contains));

const lines = ["# Layout comparison: live vs build", ""];
let total = 0;
for (const width of readdirSync(liveDir).sort((a, b) => Number(b) - Number(a))) {
  for (const file of readdirSync(path.join(liveDir, width)).filter((f) => f.endsWith(".json")).sort()) {
    const slug = file.replace(/\.json$/, "");
    const live = JSON.parse(readFileSync(path.join(liveDir, width, file), "utf8"));
    const bPath = path.join(buildDir, width, file);
    const issues = [];
    if (!existsSync(bPath)) issues.push("page missing from build map");
    else {
      const build = JSON.parse(readFileSync(bPath, "utf8"));
      CUR_VW = Number(width) || build.vw || 9999;
      // v2.6: total page height within 5% of live (catches section padding squeezed everywhere).
      if (live.docHeight && build.docHeight && Math.abs(build.docHeight - live.docHeight) > live.docHeight * 0.05)
        issues.push(`page height ${build.docHeight}px, live ${live.docHeight}px`);
      if (build.docWidth > build.vw + 1) issues.push(`horizontal scroll: page is ${build.docWidth}px wide at ${build.vw}px`);
      const by = (items, kind) => items.filter((i) => i.kind === kind || (kind === "image" && i.kind === "bgimage"));
      // Headings
      const h = matchHeadings(by(live.items, "heading"), by(build.items, "heading"));
      h.missing.forEach((i) => issues.push(`heading missing: "${i.text}"`));
      h.extra.forEach((i) => issues.push(`heading not on live: "${i.text}"`));
      h.outOfOrder.forEach((i) => issues.push(`heading out of order: "${i.text}"`));
      h.pairs.forEach(([l, b]) => issues.push(...styleDiffs(l, b, `heading "${l.text.slice(0, 40)}"`)));
      // Images
      const im = matchSeq(by(live.items, "image"), by(build.items, "image"), (i) => imageKey(i.src));
      im.missing.forEach((i) => issues.push(`photo missing: ${imageKey(i.src)}`));
      im.extra.forEach((i) => issues.push(`photo not on live: ${imageKey(i.src)}`));
      im.outOfOrder.forEach((i) => issues.push(`photo out of order: ${imageKey(i.src)}`));
      im.pairs.forEach(([l, b]) => {
        if (Math.abs(l.x - b.x) > TOL.x) issues.push(`photo ${imageKey(l.src)}: left edge ${b.x}px, live ${l.x}px`);
        if (widthOff(l.w, b.w)) issues.push(`photo ${imageKey(l.src)}: width ${b.w}px, live ${l.w}px`);
      });
      // Buttons
      const bt = matchSeq(by(live.items, "button"), by(build.items, "button"), (i) => norm(i.text));
      bt.missing.forEach((i) => issues.push(`button missing: "${i.text}"`));
      bt.pairs.forEach(([l, b]) => {
        if (colorDiff(l.bg, b.bg) > TOL.color) issues.push(`button "${l.text}": color ${b.bg}, live ${l.bg}`);
        if (widthOff(l.w, b.w)) issues.push(`button "${l.text}": width ${b.w}px, live ${l.w}px`);
      });
      // Body text (by first 40 normalized chars)
      const tx = matchSeq(by(live.items, "text"), by(build.items, "text"), (i) => norm(i.text).slice(0, 40));
      // Text split differently (one live paragraph with line breaks vs two build paragraphs) is the
      // same text: only flag what isn't inside any visible text block on the other side.
      const fullText = (items) => items.filter((i) => i.kind === "text" || i.kind === "heading").map((i) => norm(i.full || i.text)).join(" | ");
      const liveAll = fullText(live.items), buildAll = fullText(build.items);
      tx.missing.filter((i) => !buildAll.includes(norm(i.full || i.text).slice(0, 60))).forEach((i) => issues.push(`text missing: "${i.text.slice(0, 60)}"`));
      tx.extra.filter((i) => !liveAll.includes(norm(i.full || i.text).slice(0, 60))).forEach((i) => issues.push(`text not on live: "${i.text.slice(0, 60)}"`));
      (build.hiddenText || [])
        .filter((t) => norm(t).length > 20 && liveAll.includes(norm(t).slice(0, 60)) && !buildAll.includes(norm(t).slice(0, 60)))
        .forEach((t) => issues.push(`text hidden in build but visible on live: "${t.slice(0, 60)}"`));
      tx.pairs.forEach(([l, b]) => issues.push(...styleDiffs(l, b, `text "${l.text.slice(0, 30)}"`)));
      // Style runs (v2.5): each run of words on live must have the same color and weight in the
      // build, wherever the build puts those words (works across differently split paragraphs).
      const charStyles = (items) => {
        let str = "";
        const st = [];
        for (const i of items) {
          if ((i.kind !== "text" && i.kind !== "heading") || i.region !== "main") continue;
          for (const r of i.runs || [{ t: i.full || i.text, c: i.color, w: i.weight }]) {
            const t = norm(r.t);
            if (!t) continue;
            str += " " + t;
            st.push(...Array(t.length + 1).fill(r));
          }
        }
        return { str, st };
      };
      const bc = charStyles(build.items);
      let runCursor = 0;
      for (const i of live.items) {
        if ((i.kind !== "text" && i.kind !== "heading") || i.region !== "main" || !i.runs) continue;
        for (const r of i.runs) {
          const t = norm(r.t);
          if (t.length < 3) continue;
          // In page order: the next occurrence after the previous run, else anywhere.
          let at = bc.str.indexOf(" " + t, runCursor);
          if (at === -1) at = bc.str.indexOf(" " + t);
          if (at === -1) continue; // missing words are reported above
          runCursor = Math.max(runCursor, at + t.length);
          const counts = new Map();
          for (let k = at + 1; k <= at + t.length; k++) {
            const s = bc.st[k];
            if (!s) continue;
            const key = `${s.c}|${s.w}|${s.u}`;
            counts.set(key, (counts.get(key) || 0) + 1);
          }
          const [top] = [...counts.entries()].sort((x, y) => y[1] - x[1]);
          if (!top) continue;
          const [bcol, bw, bu] = top[0].split("|");
          const label = `words "${r.t.trim().slice(0, 40)}"`;
          if (colorDiff(r.c, bcol) > TOL.color) issues.push(`${label}: color ${bcol}, live ${r.c}`);
          if (Math.abs(r.w - Number(bw)) >= TOL.weight) issues.push(`${label}: weight ${bw}, live ${r.w}`);
          if (r.u !== undefined && bu !== "undefined" && String(r.u) !== bu) issues.push(`${label}: underline ${bu}, live ${r.u}`);
        }
      }
      // Vertical rhythm: the gap from each heading to the next must be close to live
      // (catches squeezed or missing section padding).
      const hp = h.pairs.filter(([l, b]) => b.text && l.text);
      for (let i = 1; i < hp.length; i++) {
        const lg = hp[i][0].y - hp[i - 1][0].y, bg = hp[i][1].y - hp[i - 1][1].y;
        if (lg > 0 && Math.abs(lg - bg) > Math.max(24, lg * 0.1)) // v2.6: was max(48, 25%)
          issues.push(`spacing from "${hp[i - 1][0].text.slice(0, 30)}" to "${hp[i][0].text.slice(0, 30)}": ${bg}px, live ${lg}px`);
      }
      // Covered: visible on live, but something sits on top of it in the build.
      [...h.pairs, ...tx.pairs, ...bt.pairs].forEach(([l, b]) => {
        if (b.covered && !l.covered) issues.push(`covered by another element: "${(l.text || "").slice(0, 50)}"`);
      });
      bt.extra.forEach((i) => issues.push(`button not on live: "${i.text}"`));
      // Icons (inline SVG, 8-72px): same count, in order, same color and size.
      const li = by(live.items, "icon"), bi = by(build.items, "icon");
      if (li.length !== bi.length) issues.push(`icons: ${bi.length} in build, ${li.length} on live`);
      li.slice(0, Math.min(li.length, bi.length)).forEach((l, i) => {
        const b = bi[i];
        if (colorDiff(l.color, b.color) > TOL.color) issues.push(`icon ${i + 1}: color ${b.color}, live ${l.color}`);
        if (Math.abs(l.w - b.w) > 6) issues.push(`icon ${i + 1}: size ${b.w}px, live ${l.w}px`);
        if (Math.abs(l.x - b.x) > TOL.x) issues.push(`icon ${i + 1}: left edge ${b.x}px, live ${l.x}px`);
      });
      // Pixels: the area behind each matched heading, text block and photo must look like live
      // (catches a wrong photo crop, a dark photo behind dark text, missing overlays).
      const shot = (dir) => [".png", ".jpg"].map((ext) => path.join(dir, width, `${slug}${ext}`)).find((f) => existsSync(f)) || "";
      const livePng = shot(liveDir);
      let buildPng = shot(buildDir);
      // Live screenshots are stored as JPEG (quality 55). Compress the build screenshot the same way
      // before comparing, so JPEG colour bleed affects both sides equally.
      if (livePng.endsWith(".jpg") && buildPng.endsWith(".png")) {
        const jpg = buildPng.replace(/\.png$/, ".cmp.jpg");
        if (!existsSync(jpg)) await sharp(buildPng).jpeg({ quality: 55 }).toFile(jpg);
        buildPng = jpg;
      }
      if (existsSync(livePng) && existsSync(buildPng)) {
        const pairsForPixels = [
          ...h.pairs.map(([l, b]) => [l, b, `heading "${l.text.slice(0, 40)}"`]),
          ...tx.pairs.filter(([l]) => l.text.length >= 20).map(([l, b]) => [l, b, `text "${l.text.slice(0, 30)}"`]),
          ...im.pairs.map(([l, b]) => [l, b, `photo ${imageKey(l.src)}`]),
        ];
        // Background behind each heading and text block, read from the screenshot: the most
        // common color around it (catches a missing grey or blue band, or a missing white card).
        for (const [l, b] of [...h.pairs, ...tx.pairs]) {
          const [lc, bc] = await Promise.all([dominant(livePng, l), dominant(buildPng, b)]);
          if (lc && bc && Math.max(...lc.map((v, i) => Math.abs(v - bc[i]))) > BG_TOL)
            issues.push(`background behind "${(l.text || "").slice(0, 40)}": rgb(${bc.join(", ")}), live rgb(${lc.join(", ")})`);
        }
        // Full-width band color: sample the left margin, outside the content column, beside each
        // heading and text block.
        const seenBand = new Set();
        for (const [l, b] of [...h.pairs, ...tx.pairs]) {
          const key = Math.round(l.y / 40);
          if (seenBand.has(key)) continue;
          seenBand.add(key);
          const marginW = Math.max(2, Math.min(16, Math.min(l.x, b.x) - 4));
          const [lc, bc] = await Promise.all([
            dominant(livePng, { x: 0, y: l.y + l.h / 2 - 4, w: marginW, h: 8 }, 0),
            dominant(buildPng, { x: 0, y: b.y + b.h / 2 - 4, w: marginW, h: 8 }, 0),
          ]);
          if (lc && bc && Math.max(...lc.map((v, i) => Math.abs(v - bc[i]))) > BG_TOL)
            issues.push(`band color beside "${(l.text || "").slice(0, 40)}": rgb(${bc.join(", ")}), live rgb(${lc.join(", ")})`);
        }
        for (const [l, b, label] of pairsForPixels) {
          if (label.startsWith("photo")) {
            const [la, ba] = await Promise.all([brightness(livePng, l), brightness(buildPng, b)]);
            if (la !== null && ba !== null && Math.abs(la - ba) > Math.max(12, la * 0.25))
              issues.push(`${label}: brightness ${ba.toFixed(0)}, live ${la.toFixed(0)} (overlay or exposure differs)`);
          }
          const d = await regionDiff(livePng, l, buildPng, b);
          if (d !== null && d > PIXEL_TOL) issues.push(`${label}: looks different from live (pixel difference ${d.toFixed(0)})`);
        }
      }
      // Section band colors (consecutive duplicates removed)
      const seq = (bands) => bands.map((b) => b.bg).filter((c, i, a) => i === 0 || colorDiff(c, a[i - 1]) > TOL.color);
      const lb = seq(live.bands), bb = seq(build.bands);
      if (lb.length !== bb.length || lb.some((c, i) => colorDiff(c, bb[i]) > TOL.color))
        issues.push(`section colors differ: build [${bb.join(" | ")}], live [${lb.join(" | ")}]`);
    }
    const remaining = issues.filter((line) => !allowed(slug, width, line));
    total += remaining.length;
    lines.push(`## ${slug} @ ${width}px: ${remaining.length ? `${remaining.length} difference(s)` : "matches"}`);
    remaining.forEach((l) => lines.push(`- ${l}`));
    lines.push("");
  }
}
lines.splice(1, 0, `Total differences: ${total}`);
writeFileSync(reportFile, lines.join("\n") + "\n");
console.log(`Total differences: ${total}. Report: ${reportFile}`);
process.exit(total ? 1 : 0);
