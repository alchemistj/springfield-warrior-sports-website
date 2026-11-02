import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { redirects } from "../../src/data/redirects";

interface VercelRedirect {
  source: string;
  destination: string;
  statusCode?: number;
  has?: Array<{ type: string; value: string }>;
}

describe("vercel redirects", () => {
  const vercel = JSON.parse(readFileSync("vercel.json", "utf8")) as { redirects: VercelRedirect[] };

  it("sends the apex host to www in one hop", () => {
    const apex = vercel.redirects.find((rule) => rule.has?.some((item) => item.value === "springfieldwarriorsports.com"));
    expect(apex?.destination).toBe("https://www.springfieldwarriorsports.com/:path*");
    expect(apex?.statusCode).toBe(301);
  });

  it("matches the redirect data, including both slash forms", () => {
    const sources = new Set(vercel.redirects.filter((rule) => !rule.has).map((rule) => rule.source));
    for (const rule of redirects) {
      expect(sources.has(rule.source)).toBe(true);
      const twin = rule.source.endsWith("/") && rule.source !== "/" ? rule.source.replace(/\/$/, "") : `${rule.source}/`;
      expect(sources.has(twin)).toBe(true);
      const row = vercel.redirects.find((item) => item.source === rule.source && !item.has);
      expect(row?.destination).toBe(rule.destination);
      expect(row?.statusCode).toBe(301);
    }
  });
});
