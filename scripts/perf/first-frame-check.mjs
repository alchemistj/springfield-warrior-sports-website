// First-frame check (FF Astro build rules): every painted frame of the above-the-fold band
// must match the settled frame. Records Chrome screencast frames under throttled mobile and
// desktop, then compares EVERY frame from the first contentful one onward (white frames kept)
// against the final frame. Pass = max mean-absolute-error ≤ 5/255 over the hero band.
//
// Usage:
//   node first-frame-check.mjs <url> [<url>...]        check pages (3 runs per profile)
//   node first-frame-check.mjs --controls              self-test: good page must PASS,
//                                                      delayed photo / swap / blank frame must FAIL
// Env: RUNS=3, PROFILES=mobile,desktop, CHROME=<path>, DUMP=<dir> (write every frame as JPEG).
// Run from a directory that has playwright and jpeg-js installed (sharp too for --controls).
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
const require = createRequire(process.cwd() + "/");
const { chromium } = require("playwright");
const jpeg = require("jpeg-js");

const EXE = process.env.CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const MAX_MAE = 5; // per channel, 0-255
const BAND = 0.6; // top 60% of the viewport
const RUNS = Number(process.env.RUNS || 3);
const PROFILES = {
  mobile: { viewport: { width: 390, height: 844 }, dpr: 2, cpu: 4, net: { latency: 150, down: (1.6 * 1024 * 1024) / 8, up: (750 * 1024) / 8 } },
  desktop: { viewport: { width: 1366, height: 900 }, dpr: 1, cpu: 1, net: { latency: 40, down: (10 * 1024 * 1024) / 8, up: (5 * 1024 * 1024) / 8 } },
};
const profileNames = (process.env.PROFILES || "mobile,desktop").split(",");

const decode = (b64) => jpeg.decode(Buffer.from(b64, "base64"), { useTArray: true });

function mae(a, b) {
  if (a.width !== b.width || a.height !== b.height) return 255;
  const rows = Math.floor(a.height * BAND);
  let sum = 0, n = 0;
  for (let y = 0; y < rows; y += 2) for (let x = 0; x < a.width; x += 2) {
    const i = (y * a.width + x) * 4;
    sum += Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
    n += 3;
  }
  return sum / n;
}

// Contentful = the band is not a single flat colour (blank white/black/background).
function contentful(img) {
  const rows = Math.floor(img.height * BAND);
  let s = 0, s2 = 0, n = 0;
  for (let y = 0; y < rows; y += 3) for (let x = 0; x < img.width; x += 3) {
    const i = (y * img.width + x) * 4;
    const l = 0.2126 * img.data[i] + 0.7152 * img.data[i + 1] + 0.0722 * img.data[i + 2];
    s += l; s2 += l * l; n++;
  }
  const m = s / n;
  return Math.sqrt(Math.max(0, s2 / n - m * m)) > 8;
}

async function run(browser, url, name, tag) {
  const p = PROFILES[name];
  const ctx = await browser.newContext({ viewport: p.viewport, deviceScaleFactor: p.dpr, extraHTTPHeaders: { "x-vercel-skip-toolbar": "1" } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: p.net.latency, downloadThroughput: p.net.down, uploadThroughput: p.net.up });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: p.cpu });
  const frames = [];
  cdp.on("Page.screencastFrame", async (f) => {
    frames.push({ t: f.metadata.timestamp * 1000, data: f.data });
    try { await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch {}
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 70, everyNthFrame: 1 });
  await page.goto(url, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(4000);
  await cdp.send("Page.stopScreencast");
  const fcp = await page.evaluate(() => performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null);
  await ctx.close();
  if (!frames.length) return { error: "no frames" };
  const start = frames[0].t;
  const imgs = frames.map((f) => ({ t: Math.round(f.t - start), img: decode(f.data) }));
  const firstIdx = imgs.findIndex((f) => contentful(f.img));
  if (firstIdx < 0) return { error: "never painted content" };
  const final = imgs[imgs.length - 1].img;
  // Every frame from first paint on, blank frames included.
  let worst = { mae: 0, t: null }, blankAfterPaint = 0, settledMs = imgs[firstIdx].t;
  for (let i = firstIdx; i < imgs.length; i++) {
    const d = mae(imgs[i].img, final);
    if (d > worst.mae) worst = { mae: d, t: imgs[i].t };
    if (d > MAX_MAE) settledMs = imgs[Math.min(i + 1, imgs.length - 1)].t;
    if (!contentful(imgs[i].img)) blankAfterPaint++;
  }
  if (process.env.DUMP) {
    fs.mkdirSync(process.env.DUMP, { recursive: true });
    imgs.forEach((f, i) => fs.writeFileSync(`${process.env.DUMP}/${tag}-${name}-${String(i).padStart(3, "0")}-${f.t}ms.jpg`, Buffer.from(frames[i].data, "base64")));
  }
  const firstMae = mae(imgs[firstIdx].img, final);
  return {
    fcp: fcp && Math.round(fcp),
    firstPaintMs: imgs[firstIdx].t,
    settledMs,
    framesChecked: imgs.length - firstIdx,
    firstVsFinalMae: +firstMae.toFixed(1),
    worstFrameMae: +worst.mae.toFixed(1),
    worstFrameMs: worst.t,
    blankFramesAfterPaint: blankAfterPaint,
    verdict: worst.mae <= MAX_MAE && blankAfterPaint === 0 ? "PASS" : "FLICKER",
  };
}

async function check(browser, urls) {
  const out = [];
  for (const url of urls) for (const name of profileNames) for (let r = 1; r <= RUNS; r++) {
    let res;
    try { res = await run(browser, url, name, `${new URL(url).pathname.replace(/\W+/g, "_")}-r${r}`); }
    catch (e) { res = { error: String(e).slice(0, 200) }; }
    const line = { url, profile: name, run: r, ...res };
    console.log(JSON.stringify(line));
    out.push(line);
  }
  return out;
}

// Negative controls: a local server with one good page and three known-bad patterns.
async function controls(browser) {
  const sharp = require("sharp");
  const W = 1280, H = 800;
  const raw = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3, n = ((x * 7919) ^ (y * 104729)) % 97;
    raw[i] = (x / W) * 200 + n % 40; raw[i + 1] = (y / H) * 160 + n % 30; raw[i + 2] = 90 + ((x >> 4) % 2 ? 60 : 0);
  }
  const photo = await sharp(raw, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 70 }).toBuffer();
  const tiny = await sharp(raw, { raw: { width: W, height: H, channels: 3 } }).resize(24).webp({ quality: 40 }).toBuffer();
  const uri = (b) => `data:image/webp;base64,${b.toString("base64")}`;
  const shell = (img, extra = "") => `<!doctype html><meta name=viewport content="width=device-width"><style>
    body{margin:0;font:700 32px/1.2 system-ui,sans-serif}header{height:64px;background:#123;color:#fff;display:flex;align-items:center;padding:0 16px}
    .hero{position:relative;height:70vh;color:#fff}.hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
    .hero h1{position:relative;margin:0;padding:80px 16px}</style>
    <header>LOGO &nbsp; Call Now</header><section class=hero>${img}<h1>Roof replacement done right</h1></section>${extra}`;
  const good = await sharp(raw, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 50 }).toBuffer();
  // Passing structure: the inline photo is the first paintable node in <body>; header, H1 and
  // CTAs follow it in source and sit on top of / below it by CSS. Nothing can paint until the
  // whole <img> tag has been parsed, so the first frame already has the photo.
  const goodPage = `<!doctype html><meta name=viewport content="width=device-width"><style>
    body{margin:0;font:700 32px/1.2 system-ui,sans-serif}.wrap{position:relative}
    .wrap>img{position:absolute;left:0;right:0;top:64px;width:100%;height:70vh;object-fit:cover}
    header{position:relative;height:64px;background:#123;color:#fff;display:flex;align-items:center;padding:0 16px}
    .hero{position:relative;height:70vh;color:#fff}.hero h1{margin:0;padding:80px 16px}</style>
    <div class=wrap><img src="${uri(good)}" alt="" width=1280 height=800 decoding=sync fetchpriority=high><header>LOGO &nbsp; Call Now</header><section class=hero><h1>Roof replacement done right</h1></section></div>`;
  const pages = {
    "/good": goodPage,
    "/header-first": shell(`<img src="${uri(good)}" alt="">`),
    "/delayed": shell(`<img src="/photo.webp" alt="">`),
    "/swap": shell(`<img id=p src="${uri(tiny)}" alt="">`, `<script>addEventListener("load",()=>setTimeout(()=>{p.src="/photo-now.webp"},300))</script>`),
    "/blank": shell(`<img src="${uri(photo)}" alt="">`, `<script>requestAnimationFrame(()=>setTimeout(()=>{document.body.style.visibility="hidden";setTimeout(()=>document.body.style.visibility="",250)},200))</script>`),
  };
  const server = http.createServer((req, res) => {
    if (req.url === "/photo.webp" || req.url === "/photo-now.webp") {
      return setTimeout(() => { res.writeHead(200, { "content-type": "image/webp" }); res.end(photo); }, req.url === "/photo.webp" ? 900 : 0);
    }
    if (!pages[req.url]) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": "text/html" }); res.end(pages[req.url]);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const results = await check(browser, Object.keys(pages).map((p) => base + p));
  server.close();
  const expect = { "/good": "PASS", "/header-first": "FLICKER", "/delayed": "FLICKER", "/swap": "FLICKER", "/blank": "FLICKER" };
  let ok = true;
  for (const r of results) {
    const want = expect[new URL(r.url).pathname];
    if (r.verdict !== want) { ok = false; console.log(`CONTROL MISMATCH ${new URL(r.url).pathname} ${r.profile} run ${r.run}: got ${r.verdict ?? r.error}, want ${want}`); }
  }
  console.log(ok ? "CONTROLS OK" : "CONTROLS FAILED");
  return ok;
}

const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });
let code = 0;
if (process.argv[2] === "--controls") code = (await controls(browser)) ? 0 : 1;
else if ((await check(browser, process.argv.slice(2))).some((r) => r.verdict !== "PASS")) code = 1;
await browser.close();
process.exit(code);
