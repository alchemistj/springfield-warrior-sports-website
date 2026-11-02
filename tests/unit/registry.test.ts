import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { indexedRoutes, routes } from "../../src/lib/routes";
import { pages } from "../../src/data/content";
import { redirects } from "../../src/data/redirects";

describe("route registry", () => {
  it("lists every captured page once, with one H1 and a unique title", () => {
    expect(routes).toHaveLength(23);
    expect(new Set(routes.map((route) => route.path)).size).toBe(routes.length);
    expect(new Set(routes.map((route) => route.title)).size).toBe(routes.length);
    for (const route of routes) {
      expect(route.h1.trim().length).toBeGreaterThan(0);
      expect(route.description.trim().length).toBeGreaterThan(0);
      expect(route.path.endsWith("/") || route.path === "/").toBe(true);
    }
    expect(indexedRoutes.some((route) => route.path.includes("registered"))).toBe(false);
    expect(routes.filter((route) => !route.index).every((route) => route.robots.includes("noindex"))).toBe(true);
  });

  it("keeps sitemap and llms sources on the indexed routes only", () => {
    const sitemap = readFileSync("src/pages/sitemap.xml.ts", "utf8");
    const llms = readFileSync("src/pages/llms.txt.ts", "utf8");
    expect(sitemap).toContain("indexedRoutes");
    expect(llms).toContain("indexedRoutes");
    expect(pages.filter((page) => page.index)).toHaveLength(indexedRoutes.length);
  });

  it("does not redirect a canonical page to somewhere else", () => {
    const canonical = new Set(routes.map((route) => route.path));
    for (const rule of redirects) {
      expect(canonical.has(rule.destination) || rule.destination === "/").toBe(true);
      expect(rule.source).not.toBe(rule.destination);
      if (canonical.has(rule.source)) expect(rule.destination).toBe(rule.source);
    }
  });
});
