import { describe, expect, it } from "vitest";
import middleware, {
  ENTRY_REDIRECTS,
  FF_BOT_MAX_AGE_SECONDS,
  FF_SID_MAX_AGE_SECONDS,
  FF_VID_MAX_AGE_SECONDS,
  entryRedirectFor,
  isCanonicalHtmlPath,
  setCookieHeaders,
} from "../../middleware";

const HUMAN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const VID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function page(path: string, init: RequestInit = {}): Request {
  return new Request(`https://www.springfieldwarriorsports.com${path}`, init);
}

function cookies(response: Response): string[] {
  return setCookieHeaders(response);
}

function named(list: string[], name: string): string | undefined {
  return list.find((cookie) => cookie.startsWith(`${name}=`));
}

describe("journey middleware", () => {
  it("sets ff_vid for 180 days and ff_sid for 30 minutes on HTML pages", () => {
    const response = middleware(page("/contact/", { headers: { "user-agent": HUMAN } }));
    const set = cookies(response);
    const vid = named(set, "ff_vid");
    const sid = named(set, "ff_sid");
    expect(vid).toBeTruthy();
    expect(sid).toBeTruthy();
    expect(vid).toContain(`Max-Age=${FF_VID_MAX_AGE_SECONDS}`);
    expect(sid).toContain(`Max-Age=${FF_SID_MAX_AGE_SECONDS}`);
    expect(vid).toContain("Path=/");
    expect(vid).toContain("SameSite=Lax");
    expect(vid).toContain("Secure");
    expect(vid?.toLowerCase()).not.toContain("httponly");
    expect(named(set, "ff_bot")).toBeUndefined();
    expect(response.headers.get("cache-control")).toBeNull();
  });

  it("keeps ff_vid and renews ff_sid on the next page", () => {
    const response = middleware(
      page("/kids-classes/", {
        headers: { "user-agent": HUMAN, cookie: `ff_vid=${VID}; ff_sid=${SID}` },
      }),
    );
    const set = cookies(response);
    expect(named(set, "ff_vid")).toBeUndefined();
    expect(named(set, "ff_sid")).toContain(`ff_sid=${encodeURIComponent(SID)}`);
    expect(named(set, "ff_sid")).toContain(`Max-Age=${FF_SID_MAX_AGE_SECONDS}`);
  });

  it("marks bots with ff_bot and does not set visitor cookies", () => {
    const response = middleware(
      page("/", { headers: { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" } }),
    );
    const set = cookies(response);
    expect(named(set, "ff_bot")).toBe(`ff_bot=1; Path=/; Max-Age=${FF_BOT_MAX_AGE_SECONDS}; SameSite=Lax; Secure`);
    expect(named(set, "ff_vid")).toBeUndefined();
    expect(named(set, "ff_sid")).toBeUndefined();
  });

  it("sets no cookies on assets, API routes, prefetch, or non-GET", () => {
    const paths = ["/_astro/app.js", "/api/site-events", "/api/preview-forms-lead/", "/favicon.png", "/og.jpg"];
    for (const path of paths) {
      const response = middleware(page(path, { headers: { "user-agent": HUMAN } }));
      expect(cookies(response), path).toEqual([]);
      expect(isCanonicalHtmlPath(path), path).toBe(false);
    }
    expect(cookies(middleware(page("/contact/", { method: "POST", headers: { "user-agent": HUMAN } })))).toEqual([]);
    expect(
      cookies(
        middleware(page("/contact/", { headers: { "user-agent": HUMAN, purpose: "prefetch" } })),
      ),
    ).toEqual([]);
  });

  it("ships an empty entry map and can 308 a confirmed vanity path", () => {
    expect(ENTRY_REDIRECTS).toEqual({});
    expect(entryRedirectFor("/Springfield")).toBeNull();
    const plain = middleware(page("/Springfield", { headers: { "user-agent": HUMAN } }));
    expect(plain.status).toBe(200);
    expect(plain.headers.get("location")).toBeNull();
    expect(cookies(plain)).toEqual([]);

    const redirected = middleware(page("/Springfield?gclid=abc", { headers: { "user-agent": HUMAN } }), {
      "/Springfield": { destination: "/", entry: "gbp-springfield" },
    });
    expect(redirected.status).toBe(308);
    expect(redirected.headers.get("location")).toBe("/?gclid=abc");
    expect(named(cookies(redirected), "ff_entry")).toContain("ff_entry=gbp-springfield");
  });
});
