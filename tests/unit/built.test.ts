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
    const visible = new Map(pages.map((page) => [page.slug, visibleText(distHtml(page.path))]));
    for (const page of pages) {
      const html = distHtml(page.path);
      expect(decodeHtml(html)).toContain(`<title>${page.title}</title>`);
      expect(html.match(/<h1[\s>]/g)?.length).toBe(1);
      expect(html).toContain(page.h1.split(" ").slice(0, 2).join(" "));
      if (!page.index) expect(html).toContain("noindex");
      // Josh's address decision (2 Nov 2026) replaces the old contact-page address line.
      const source = readFileSync(`source/pages/${page.slug}/text.txt`, "utf8")
        .replace("605 W. Plainview Road Springfield, MO 65810", site.address.display)
        // Launch polish, 18 Nov 2026: every phone number uses the one site format, "(417) 894-7319".
        .replace(/\(417\)894-7319/g, site.phone.display);
      const text = visible.get(page.slug) ?? "";
      // Live renders this competitions sentence at font-size 0. It is removed, not hidden.
      // A review may move to the page it talks about. It still has to be visible somewhere.
      const missing = sentences(mainContent(source))
        .filter((sentence) => !sentence.includes("January 13th competitions will go up"))
        // Josh, 15 Nov 2026: the day-camps-for-school-breaks card and its text are removed until the client confirms the offer.
        .filter((sentence) => !/school break with dynamic and thrilling|flexible half-day or full-day camp options/.test(sentence))
        // Josh, 16 Nov 2026: past WNL, CSNA, and 2026 summer-camp registration copy is off until new dates are set.
        .filter((sentence) => !/early bird pricing for these competitions is \$55/i.test(sentence))
        .filter((sentence) => !/October 26th competition/i.test(sentence))
        .filter((sentence) => !/filling out the registration form below to save your kid's spot/i.test(sentence))
        .filter((sentence) => !/active, exciting days during school break at our fun day camps/i.test(sentence))
        .filter((sentence) => !/half-day and full-days camp options/i.test(sentence))
        .filter((sentence) => !/call with questions or to register by phone|discounts and get registered/i.test(sentence))
        .filter((sentence) => !text.includes(sentence))
        .filter((sentence) => ![...visible.values()].some((other) => other.includes(sentence)));
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

  it("follows the 15 Nov decisions: no trust bar, no day-camps card, booking page unindexed", () => {
    // Josh, 15 Nov 2026. Rule 9 is waived, so no page prints a trust bar.
    // The day-camps card and its text are gone from the site until the client confirms the offer still runs.
    // Courtney C. and Nick P. moved to kids classes so home keeps Jennifer L. and Lee C.
    const home = distHtml("/");
    expect(home).not.toContain("trust-bar");
    expect(home).not.toContain("Day Camps for School Breaks");
    expect(home).not.toContain("Courtney C.");
    expect(home).not.toContain("Nick P.");
    expect(home).toContain("Jennifer L.");
    expect(home).toContain("Lee C.");
    const kids = distHtml("/kids-classes/");
    expect(kids).toContain("Courtney C.");
    expect(kids).toContain("Nick P.");
    const camps = distHtml("/summer-camps-in-springfield-mo/");
    expect(camps).not.toContain("Elevate your children's school break");
    const book = distHtml("/schedule-birthday-party/");
    expect(book).toContain("noindex, nofollow");
    expect(book).toContain("Book a Birthday Party");
    expect(book).not.toContain("trust-bar");
    expect(book).not.toContain('class="atf-photo');
    const about = distHtml("/about/");
    expect(about).not.toContain("trust-bar");
    const sitemap = readFileSync("dist/sitemap.xml", "utf8");
    expect(sitemap).not.toContain("/schedule-birthday-party/");
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
