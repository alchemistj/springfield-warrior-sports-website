// Builds src/data/content.json, src/data/events.json, src/data/redirects.ts,
// vercel.json, optimized images, and one thin Astro page per route.
// Source of truth: source/ (captured live site). Re-run with `npm run prepare:content`.
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { FOOTER_TAGLINE, collapse, mainContent } from "./copy-text.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "source");

const FORM_BY_SLUG = {
  "schedule-birthday-party": "birthday-party",
  "summer-camps-in-springfield-mo": "camp-registration",
  competitions: "csna",
  "wnl-competitions": "wnl",
  "personal-training": "personal-training",
  "nerf-wars": "nerf",
  "laser-tag": "laser",
  contact: "contact",
};

const LOGO_NAME = /logo|qoute|hulafrog|417local|friction|godfather|supplement|ninja-league|csna-logo|national-ninja/i;

function stripTags(html) {
  return collapse(String(html ?? "").replace(/\\\//g, "/").replace(/<[^>]+>/g, " "));
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function finalPath(url) {
  const raw = String(url).trim();
  if (!raw) return "/";
  let pathname = raw;
  try {
    if (/^https?:/i.test(raw)) pathname = new URL(raw).pathname;
  } catch {
    pathname = raw;
  }
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  if (pathname !== "/" && !pathname.endsWith("/")) pathname = `${pathname}/`;
  return pathname;
}

async function loadManifest() {
  const text = await readFile(path.join(source, "media/manifest.tsv"), "utf8");
  const byUrl = new Map();
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const tab = line.indexOf("\t");
    if (tab < 0) continue;
    const file = line.slice(0, tab).trim();
    const url = line.slice(tab + 1).trim();
    byUrl.set(url, file);
    try {
      byUrl.set(decodeURIComponent(url), file);
    } catch {
      /* keep the raw url */
    }
  }
  return byUrl;
}

function fileFromUrl(url, manifest) {
  const clean = url.replace(/&amp;/g, "&").split("?")[0];
  return manifest.get(clean) || manifest.get(decodeURIComponent(clean)) || null;
}

function isHeadingLine(line) {
  const letters = line.replace(/[^A-Za-z]/g, "");
  return letters.length > 3 && letters === letters.toUpperCase() && line.length <= 120 && !/[.!?]$/.test(line);
}

function blocksFrom(text, links, redirectMap) {
  const linkByText = new Map();
  for (const link of links) {
    const label = collapse(stripTags(link.text || ""));
    if (!label || label.length < 3) continue;
    linkByText.set(label.toLowerCase(), link.href);
  }
  const lines = mainContent(text).split("\n").map((line) => collapse(line));
  const chunks = [];
  let para = [];
  const flush = () => {
    if (para.length) chunks.push(para.join(" "));
    para = [];
  };
  for (const line of lines) {
    if (!line) {
      flush();
      continue;
    }
    const linked = linkByText.has(line.toLowerCase());
    const schedule = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Preschool hours)\b/.test(line);
    if (linked || isHeadingLine(line) || schedule) {
      flush();
      chunks.push(line);
      continue;
    }
    para.push(line);
  }
  flush();
  return chunks
    .filter((chunk) => chunk !== FOOTER_TAGLINE)
    .filter((chunk) => !/^\*+\s*indicates required fields$/i.test(chunk))
    .filter((chunk) => !/^(submit|notify me)$/i.test(chunk))
    .map((chunk) => {
      const hrefRaw = linkByText.get(chunk.toLowerCase());
      if (hrefRaw) {
        let href = hrefRaw;
        if (/springfieldwarriorsports\.com/i.test(href) || href.startsWith("/")) {
          const dest = finalPath(href);
          href = redirectMap.get(dest) || dest;
        }
        return { type: "a", text: chunk, href };
      }
      return { type: isHeadingLine(chunk) ? "h2" : "p", text: chunk };
    });
}

function h1For(meta, blocks) {
  const lines = (meta.h1 || []).map((line) => collapse(line)).filter(Boolean);
  if (lines.length) return lines.join(" ");
  const heading = blocks.find((b) => b.type === "h2");
  if (heading) return heading.text;
  return "";
}

async function optimizeImage(srcFile, destFile, width) {
  await mkdir(path.dirname(destFile), { recursive: true });
  await sharp(srcFile)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 72 })
    .toFile(destFile);
}

async function writeEvents() {
  const specs = [
    {
      id: "birthday-party",
      formKey: "birthday-party",
      gf: 1,
      event: "Birthday Party Booking",
      page: "/schedule-birthday-party/",
      anchor: "party-form",
    },
    {
      id: "camp-registration",
      formKey: "camp-registration",
      gf: 17,
      event: "2026 Summer Camp",
      page: "/summer-camps-in-springfield-mo/",
      anchor: "lead-form",
    },
    {
      id: "csna",
      formKey: "competition-registration",
      gf: 19,
      event: "September 19, 2026 CSNA Competition",
      page: "/competitions/",
      anchor: "lead-form",
      repeater: true,
    },
    {
      id: "wnl",
      formKey: "competition-registration",
      gf: 10,
      event: "WNL Competition",
      page: "/wnl-competitions/",
      anchor: "lead-form",
    },
    {
      id: "personal-training",
      formKey: "personal-training",
      gf: 15,
      event: "Personal Training",
      page: "/personal-training/",
      anchor: "lead-form",
    },
    {
      id: "nerf",
      formKey: "event-waitlist",
      gf: 5,
      event: "Nerf War Night",
      page: "/nerf-wars/",
      anchor: "lead-form",
    },
    {
      id: "laser",
      formKey: "event-waitlist",
      gf: 6,
      event: "Laser Tag Night",
      page: "/laser-tag/",
      anchor: "lead-form",
    },
  ];

  const events = [];
  for (const spec of specs) {
    const gf = await readJson(path.join(source, `forms/gf-${spec.gf}.json`));
    const confirmation = gf.confirmations?.[0] ?? {};
    let success;
    if (confirmation.type === "redirect" || confirmation.type === "page") {
      success = { type: "redirect", path: finalPath(String(confirmation.url).replace(/\\\//g, "/")) };
    } else {
      success = { type: "message", message: stripTags(confirmation.message || "Thank you! We will be in touch shortly!") };
    }
    const fields = [];
    let inRepeater = false;
    const repeaterFields = [];
    const pushField = (field) => {
      if (spec.repeater && inRepeater) repeaterFields.push(field);
      else fields.push(field);
    };
    for (const field of gf.fields || []) {
      if (field.type === "repeater_start") {
        inRepeater = true;
        continue;
      }
      if (field.type === "repeater_end") {
        inRepeater = false;
        continue;
      }
      if (field.type === "name") {
        pushField({ kind: "name", label: stripTags(field.label || "Name"), required: !!field.isRequired });
        continue;
      }
      if (field.type === "checkbox" || field.type === "radio" || field.type === "select") {
        const choices = (field.choices || field.inputs || []).map((c) => stripTags(c.text || c.label || "")).filter(Boolean);
        pushField({
          kind: field.type,
          name: slugKey(field.label || field.type),
          label: stripTags(field.label || ""),
          required: !!field.isRequired,
          choices,
        });
        continue;
      }
      const kind = field.type === "email" ? "email" : field.type === "phone" ? "phone" : field.type === "textarea" ? "textarea" : field.type === "date" ? "date" : "text";
      pushField({
        kind,
        name: slugKey(field.label || kind),
        label: stripTags(field.label || ""),
        required: !!field.isRequired,
      });
    }
    events.push({
      id: spec.id,
      formKey: spec.formKey,
      event: spec.event,
      page: spec.page,
      anchor: spec.anchor,
      button: collapse(gf.button || "") || "Submit",
      open: true,
      success,
      fields,
      repeater: spec.repeater
        ? { max: 4, addLabel: "Add another competitor", removeLabel: "Remove", fields: repeaterFields }
        : null,
    });
  }

  events.push({
    id: "contact",
    formKey: "main-contact",
    event: "Contact",
    page: "/contact/",
    anchor: "lead-form",
    button: "Submit",
    open: true,
    success: { type: "message", message: "Thank you! We will be in touch shortly!" },
    fields: [
      { kind: "text", name: "firstName", label: "First Name", required: true, namePart: "first" },
      { kind: "text", name: "lastName", label: "Last Name", required: true, namePart: "last" },
      { kind: "email", name: "email", label: "Email", required: true },
      { kind: "text", name: "subject", label: "Subject", required: true },
      { kind: "textarea", name: "message", label: "Message", required: true },
    ],
    repeater: null,
  });

  await writeFile(path.join(root, "src/data/events.json"), JSON.stringify(events, null, 2) + "\n");
  return events;
}

function slugKey(label) {
  const words = stripTags(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 6);
  if (!words.length || !words[0]) return "field";
  return words[0] + words.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
}

async function writeRedirects(pages) {
  const tsv = await readFile(path.join(source, "redirects-existing.tsv"), "utf8");
  const rules = [];
  const seen = new Set();
  for (const line of tsv.split("\n").slice(1)) {
    if (!line.trim()) continue;
    const [src] = line.split("\t");
    const destUrl = line.split("\t")[1];
    const destination = finalPath(destUrl);
    const sourcePath = finalPath(src.startsWith("/") ? src : `/${src}`);
    const key = `${sourcePath} ${destination}`;
    if (seen.has(key) || sourcePath === destination) continue;
    seen.add(key);
    rules.push({ source: sourcePath, destination });
  }
  const canonical = new Set(pages.map((p) => p.path));
  for (const pathName of canonical) {
    if (pathName === "/") continue;
    const bare = pathName.replace(/\/$/, "");
    if (!rules.some((r) => r.source === bare)) rules.push({ source: bare, destination: pathName });
  }

  const ts = `// Generated by scripts/prepare-content.mjs. Legacy rules plus no-slash to slash.
export interface RedirectRule {
  source: string;
  destination: string;
}

export const redirects: readonly RedirectRule[] = ${JSON.stringify(rules, null, 2)};
`;
  await writeFile(path.join(root, "src/data/redirects.ts"), ts);

  const vercelRedirects = [
    {
      source: "/:path*",
      has: [{ type: "host", value: "springfieldwarriorsports.com" }],
      destination: "https://www.springfieldwarriorsports.com/:path*",
      statusCode: 301,
    },
  ];
  for (const rule of rules) {
    const dest = rule.destination === "/" ? "/" : rule.destination;
    vercelRedirects.push({ source: rule.source, destination: dest, statusCode: 301 });
    // The other slash form, unless it is the destination itself (that would loop).
    let twin = null;
    if (rule.source !== "/" && rule.source.endsWith("/")) twin = rule.source.replace(/\/$/, "");
    else if (!rule.source.endsWith("/")) twin = `${rule.source}/`;
    if (twin && twin !== dest) vercelRedirects.push({ source: twin, destination: dest, statusCode: 301 });
  }
  const vercel = {
    $schema: "https://openapi.vercel.sh/vercel.json",
    redirects: vercelRedirects,
    headers: [
      {
        source: "/_astro/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/((?!_astro/).*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ],
  };
  await writeFile(path.join(root, "vercel.json"), JSON.stringify(vercel, null, 2) + "\n");
  return rules;
}

function pageStub(slug) {
  const rel = slug === "home" ? ".." : "../..";
  return `---
import VenuePage from "${rel}/components/VenuePage.astro";
import { pageBySlug } from "${rel}/data/content";

const page = pageBySlug("${slug}");
---

<VenuePage page={page} />
`;
}

async function fonts() {
  const dir = path.join(root, "src/assets/fonts");
  await mkdir(dir, { recursive: true });
  const files = {
    "heebo-400.woff2": "https://cdn.jsdelivr.net/fontsource/fonts/heebo@5.2.8/latin-400-normal.woff2",
    "heebo-700.woff2": "https://cdn.jsdelivr.net/fontsource/fonts/heebo@5.2.8/latin-700-normal.woff2",
    "epilogue-700.woff2": "https://cdn.jsdelivr.net/fontsource/fonts/epilogue@5.2.8/latin-700-normal.woff2",
    "epilogue-800.woff2": "https://cdn.jsdelivr.net/fontsource/fonts/epilogue@5.2.8/latin-800-normal.woff2",
  };
  for (const [name, url] of Object.entries(files)) {
    const dest = path.join(dir, name);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Font download failed ${url} ${res.status}`);
    await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  }
}

async function main() {
  const manifest = await loadManifest();
  const skipped = new Set(
    (await readFile(path.join(source, "media/skipped.txt"), "utf8"))
      .split("\n")
      .map((l) => l.replace(/^SKIP\s+/, "").trim())
      .filter(Boolean),
  );
  const pagesJson = await readJson(path.join(source, "pages.json"));
  const mediaDir = path.join(root, "src/assets/media");
  await rm(mediaDir, { recursive: true, force: true });
  await mkdir(mediaDir, { recursive: true });
  const copied = new Map();

  async function useImage(url, alt) {
    if (!url || skipped.has(url.split("?")[0])) return null;
    const file = fileFromUrl(url, manifest);
    if (!file) return null;
    const srcFile = path.join(source, "media", file);
    const safe = file.replace(/[^A-Za-z0-9._-]+/g, "-");
    const webp = safe.replace(/\.[^.]+$/, "") + ".webp";
    if (!copied.has(webp)) {
      try {
        await optimizeImage(srcFile, path.join(mediaDir, webp), LOGO_NAME.test(file) ? 480 : 1200);
      } catch (err) {
        console.warn("skip image", file, err.message);
        return null;
      }
      copied.set(webp, true);
    }
    return {
      file: `media/${webp}`,
      alt: collapse(alt || ""),
      kind: LOGO_NAME.test(file) ? "logo" : "photo",
    };
  }

  const pages = [];
  for (const entry of pagesJson) {
    const dir = path.join(source, "pages", entry.slug);
    const meta = await readJson(path.join(dir, "meta.json"));
    const text = await readFile(path.join(dir, "text.txt"), "utf8");
    const redirectMap = new Map();
    const tsv = await readFile(path.join(source, "redirects-existing.tsv"), "utf8");
    for (const line of tsv.split("\n").slice(1)) {
      if (!line.trim()) continue;
      const [src, dest] = line.split("\t");
      redirectMap.set(finalPath(src.startsWith("/") ? src : `/${src}`), finalPath(dest));
    }
    const blocks = blocksFrom(text, meta.links || [], redirectMap);
    const index = !String(meta.robots || "").includes("noindex");
    let description = collapse(meta.description || "");
    if (!description) {
      const first = blocks.find((b) => b.type === "p");
      description = (first?.text || entry.title).slice(0, 155);
    }
    const images = [];
    const seenImg = new Set();
    for (const bg of meta.bgs || []) {
      const url = String(bg).match(/url\("([^"]+)"\)/)?.[1];
      const img = url ? await useImage(url, "") : null;
      if (img && !seenImg.has(img.file)) {
        seenImg.add(img.file);
        images.push(img);
      }
    }
    for (const im of meta.imgs || []) {
      const img = await useImage(im.src, im.alt || "");
      if (img && !seenImg.has(img.file)) {
        seenImg.add(img.file);
        images.push(img);
      }
    }
    const photos = images.filter((img) => img.kind === "photo");
    const h1 = h1For(meta, blocks);
    const h1key = collapse(h1).toLowerCase();
    const body = blocks.filter((b, idx) => !(idx === 0 && b.type === "h2" && collapse(b.text).toLowerCase() === h1key));
    pages.push({
      slug: entry.slug,
      path: entry.path,
      title: entry.title,
      description,
      h1: h1 || entry.title,
      h1FromSource: (meta.h1 || []).length > 0,
      index,
      robots: index
        ? meta.robots || "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        : "noindex, nofollow",
      photoHero: photos.length > 0,
      heroFile: photos[0]?.file ?? null,
      heroAlt: photos[0]?.alt || h1 || entry.title,
      images: photos.slice(1),
      logos: images.filter((img) => img.kind === "logo"),
      formId: FORM_BY_SLUG[entry.slug] ?? null,
      blocks: body,
    });
  }

  await mkdir(path.join(root, "src/data"), { recursive: true });
  await writeFile(path.join(root, "src/data/content.json"), JSON.stringify({ pages }, null, 2) + "\n");
  await writeEvents();
  await writeRedirects(pages);

  const pagesDir = path.join(root, "src/pages");
  await mkdir(pagesDir, { recursive: true });
  for (const page of pages) {
    if (page.slug === "home") {
      await writeFile(path.join(pagesDir, "index.astro"), pageStub("home"));
    } else {
      const dir = path.join(pagesDir, page.slug);
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, "index.astro"), pageStub(page.slug));
    }
  }

  const logoSrc = path.join(source, "media/2023-03-SpringField-Warrior-Logo.png");
  await sharp(logoSrc).resize({ width: 280 }).png({ palette: true, colors: 24, compressionLevel: 9 }).toFile(path.join(root, "src/assets/logo.png"));
  await mkdir(path.join(root, "public"), { recursive: true });
  await sharp(logoSrc).resize({ width: 48, height: 48, fit: "contain", background: "#ffffff" }).png().toFile(path.join(root, "public/favicon.png"));
  await sharp(logoSrc).resize({ width: 192, height: 192, fit: "contain", background: "#ffffff" }).png().toFile(path.join(root, "public/favicon-192.png"));
  await sharp(logoSrc).resize({ width: 180, height: 180, fit: "contain", background: "#ffffff" }).png().toFile(path.join(root, "public/apple-touch-icon.png"));
  const heroSrc = pages.find((p) => p.heroFile)?.heroFile;
  if (heroSrc) {
    await sharp(path.join(root, "src/assets", heroSrc)).resize({ width: 1200 }).jpeg({ quality: 70 }).toFile(path.join(root, "public/og.jpg"));
  }
  await fonts();
  console.log(`Prepared ${pages.length} pages, ${copied.size} images.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
