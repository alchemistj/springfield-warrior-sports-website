import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { pages } from "../../src/data/content";
import { routes } from "../../src/lib/routes";
import { site } from "../../src/data/site";
import { decodeHtml, mainContent, sentences, visibleText } from "../../scripts/copy-text.mjs";

function distHtml(urlPath: string): string {
  const file = urlPath === "/" ? "dist/index.html" : path.join("dist", urlPath, "index.html");
  return readFileSync(file, "utf8");
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

describe("built site", () => {
  it("contains each page sentence, one h1, and the live title", () => {
    expect(existsSync("dist/index.html")).toBe(true);
    for (const page of pages) {
      const html = distHtml(page.path);
      expect(decodeHtml(html)).toContain(`<title>${page.title}</title>`);
      expect(html.match(/<h1[\s>]/g)?.length).toBe(1);
      expect(html).toContain(page.h1.split(" ").slice(0, 2).join(" "));
      if (!page.index) expect(html).toContain("noindex");
      // Josh's address decision (2 Nov 2026) replaces the old contact-page address line.
      const source = readFileSync(`source/pages/${page.slug}/text.txt`, "utf8")
        .replace("605 W. Plainview Road Springfield, MO 65810", site.address.display);
      const text = visibleText(html);
      const missing = sentences(mainContent(source)).filter((sentence) => !text.includes(sentence));
      expect(missing, page.slug).toEqual([]);
      const outsideForm = visibleText(html.replace(/<form\b[\s\S]*?<\/form>/gi, " "));
      expect(outsideForm, page.slug).not.toMatch(/\(Required\)/i);
      // Live shows this one sentence above the schedule form. Every other form-dump phrase stays inside the form.
      const outsideCopy = page.slug === "schedule-birthday-party" ? outsideForm.replace(/indicates required fields/gi, "") : outsideForm;
      expect(outsideCopy, page.slug).not.toMatch(/indicates required fields/i);
      expect(outsideForm, page.slug).not.toMatch(/First and Last Name\s*\*/i);
      expect(outsideForm, page.slug).not.toMatch(/Participant 1 Name/i);
    }
  });

  it("shows the agreed address and keeps the NAP exact in JSON-LD", () => {
    for (const urlPath of ["/", "/contact/"]) {
      const html = decodeHtml(distHtml(urlPath));
      expect(html, urlPath).toContain(site.address.display);
      expect(html, urlPath).not.toContain("605 W. Plainview Road");
      expect(html, urlPath).toContain('"streetAddress":"605 W Farm Rd 182"');
    }
  });

  it("uses only the NAP phone number", () => {
    const files = walk("dist").filter((file) => /\.(html|xml|txt|js)$/.test(file));
    const phone = /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]*)\d{3}[\s.-]*\d{4}/g;
    for (const file of files) {
      const text = readFileSync(file, "utf8")
        .replace(/data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+/gi, "")
        .replace(/placeholder="\(999\) 999-9999"/g, "");
      for (const match of text.match(phone) ?? []) {
        const digits = match.replace(/\D/g, "");
        expect([site.phone.e164.replace(/\D/g, ""), "4178947319"]).toContain(digits.length === 11 ? digits : digits);
        expect(digits.endsWith("4178947319")).toBe(true);
      }
    }
  });

  it("keeps internal links on registry paths and the lead URL in the bundle", () => {
    const allowed = new Set(routes.map((route) => route.path));
    const html = walk("dist").filter((file) => file.endsWith(".html")).map((file) => readFileSync(file, "utf8")).join("\n");
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1] ?? "");
    for (const href of hrefs) {
      if (!href.startsWith("/") || href.startsWith("//")) continue;
      if (href.startsWith("/_astro") || href.startsWith("/api/") || href.startsWith("/favicon") || href.startsWith("/apple") || href.startsWith("/og")) continue;
      const pathName = href.split("#")[0]?.split("?")[0] ?? "";
      if (pathName === "/sitemap.xml" || pathName === "/robots.txt" || pathName === "/llms.txt") continue;
      expect(allowed.has(pathName), href).toBe(true);
    }
    const js = walk("dist").filter((file) => file.endsWith(".js")).map((file) => readFileSync(file, "utf8")).join("\n");
    expect(js + html).toContain("https://forms.fluidframemarketing.com/api/lead");
    expect(html).not.toContain("maps.google.com/maps");
  });
});
