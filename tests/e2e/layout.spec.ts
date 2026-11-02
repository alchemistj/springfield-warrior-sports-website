import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const pages = JSON.parse(readFileSync(new URL("../../src/data/content.json", import.meta.url), "utf8")).pages as {
  slug: string;
  path: string;
}[];

test("desktop and mobile layout", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  const desktopScroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(desktopScroll).toBeLessThanOrEqual(1);
  await expect(page.locator(".call-bar")).toBeHidden();
  await expect(page.locator("[data-menu]")).toBeHidden();

  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(100);
  await expect(page.locator("[data-header]")).toHaveClass(/is-hidden/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  await expect(page.locator("[data-header]")).not.toHaveClass(/is-hidden/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/birthday-parties/");
  const mobileScroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(mobileScroll).toBeLessThanOrEqual(1);
  await expect(page.locator(".call-bar")).toBeVisible();
  const bar = page.locator(".call-bar");
  await expect(bar.locator("a").nth(0)).toHaveAttribute("href", "tel:+14178947319");
  await expect(bar.locator("a").nth(1)).toHaveAttribute("href", "/schedule-birthday-party/");
  const desktopLinks = await page.locator("#site-menu a").evaluateAll((nodes) => nodes.map((node) => (node.textContent || "").trim()));
  await page.locator("[data-menu]").click();
  await expect(page.locator("#site-menu")).toBeVisible();
  const openLinks = await page.locator("#site-menu a").evaluateAll((nodes) => nodes.map((node) => (node.textContent || "").trim()));
  expect(openLinks).toEqual(desktopLinks);
  expect(openLinks.length).toBeGreaterThan(5);
});

test("party page call bar jumps to the form", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/schedule-birthday-party/");
  await expect(page.locator(".call-bar a").nth(1)).toHaveAttribute("href", "#party-form");
  await expect(page.locator("#party-form")).toBeVisible();
});

test("contact map does not request Google on load", async ({ page }) => {
  const hits: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (/maps\.google|maps\.googleapis|googletagmanager/.test(url)) hits.push(url);
  });
  await page.goto("/contact/");
  await page.waitForTimeout(500);
  expect(hits).toEqual([]);
});

test("screenshots of every page", async ({ page }) => {
  test.setTimeout(600_000);
  const sharp = (await import("sharp")).default;
  const { mkdir } = await import("node:fs/promises");
  await mkdir("docs/qa/screens", { recursive: true });
  for (const item of pages) {
    for (const [name, width, height] of [
      ["desktop", 1440, 900],
      ["mobile", 390, 844],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.goto(item.path);
      const png = await page.screenshot({ fullPage: true });
      await sharp(png).resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 60 }).toFile(`docs/qa/screens/${item.slug}-${name}.jpg`);
    }
  }
});
