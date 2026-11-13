import { afterEach, describe, expect, it, vi } from "vitest";
import { SITE_KEY, SubmissionAttempt, buildBody, submitLead, type FieldValues } from "../../src/lib/forms";
import { SESSION_CHANNEL_KEY } from "../../src/lib/measurement/contract";
import {
  beginPageEngagement,
  buildMeasurementEvent,
  collectContactClick,
  collectClickToCall,
  collectLeadFormSuccess,
  collectMeasurementEvent,
  collectPageView,
  pageViewEventIdFor,
  resetMeasurementForTests,
  signalPageEngaged,
} from "../../src/lib/measurement/collect";
import { ctaLocationFor } from "../../src/lib/measurement/ctaLocation";
import { bindJourneyInteractions } from "../../src/lib/measurement/interactions";
import { isContactHref } from "../../src/lib/measurement/contactHref";

const VID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const COOKIE = `ff_vid=${VID}; ff_sid=${SID}`;
const PII_KEYS = ["name", "email", "phone", "tel", "address", "message"];

type Sent = Record<string, unknown>;

function memoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, value);
    },
  };
}

function installBrowser(pathname = "/contact/") {
  const sent: Sent[] = [];
  const session = memoryStorage();
  const local = memoryStorage();
  const listeners = new Map<string, Set<EventListener>>();
  const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
    sent.push(JSON.parse(String(init?.body ?? "{}")) as Sent);
    return new Response("{}", { status: 202 });
  });
  const windowStub = {
    location: { pathname, search: "", hostname: "www.springfieldwarriorsports.com", href: `https://www.springfieldwarriorsports.com${pathname}` },
    innerWidth: 390,
    navigator: { webdriver: false, userAgent: "Mozilla/5.0", languages: ["en-US"] },
    sessionStorage: session,
    localStorage: local,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    setTimeout: (fn: () => void, ms?: number) => setTimeout(fn, ms) as unknown as number,
    clearTimeout: (id: number) => clearTimeout(id),
    matchMedia: (query: string) => ({ matches: query.includes("max-width"), media: query }),
  };
  const documentStub = {
    cookie: COOKIE,
    referrer: "",
    visibilityState: "visible",
    readyState: "complete",
    addEventListener: (type: string, fn: EventListener) => {
      const set = listeners.get(type) ?? new Set();
      set.add(fn);
      listeners.set(type, set);
    },
    removeEventListener: (type: string, fn: EventListener) => {
      listeners.get(type)?.delete(fn);
    },
  };
  vi.stubGlobal("window", windowStub);
  vi.stubGlobal("document", documentStub);
  vi.stubGlobal("navigator", windowStub.navigator);
  vi.stubGlobal("fetch", fetchImpl);
  return {
    sent,
    fetchImpl,
    session,
    click(target: unknown) {
      for (const fn of listeners.get("click") ?? []) fn({ target } as unknown as Event);
    },
  };
}

function assertIdentity(event: Sent, path: string) {
  expect(event.visitorId).toBe(VID);
  expect(event.sessionId).toBe(SID);
  expect(event.currentPath).toBe(path);
  expect(event.siteKey).toBe("springfield-warrior-sports-website");
  for (const key of PII_KEYS) expect(event[key]).toBeUndefined();
  expect(JSON.stringify(event)).not.toMatch(/@/);
}

const initFor = (fetchImpl: typeof fetch) => ({
  cookieHeader: COOKIE,
  currentHost: "www.springfieldwarriorsports.com",
  fetchImpl,
  now: () => "2026-11-13T01:00:00.000Z",
});

afterEach(() => {
  resetMeasurementForTests();
  vi.unstubAllGlobals();
});

describe("journey events", () => {
  it("sends each event once with the visitor id, session id, and path", async () => {
    const browser = installBrowser("/kids-classes/");
    const init = initFor(browser.fetchImpl);
    beginPageEngagement("/kids-classes/");
    const view = await collectPageView(init);
    const call = await collectClickToCall({ ctaLocation: "header" }, init);
    const contact = await collectContactClick({ ctaLocation: "footer" }, init);
    const lead = await collectLeadFormSuccess(
      { submissionId: "3f2b8c1e-5d4a-4b6f-9a7c-1e2d3c4b5a69", formSource: "main-contact", currentPath: "/contact/" },
      init,
    );
    expect([view, call, contact, lead].every((result) => result.ok && result.sent)).toBe(true);
    expect(browser.sent.map((event) => event.event)).toEqual([
      "page_view",
      "click_to_call",
      "contact_click",
      "lead_form_success",
    ]);
    assertIdentity(browser.sent[0]!, "/kids-classes/");
    expect(browser.sent[1]).toMatchObject({ event: "click_to_call", ctaLocation: "header" });
    expect(browser.sent[2]).toMatchObject({ event: "contact_click", ctaLocation: "footer" });
    expect(browser.sent[3]).toMatchObject({
      event: "lead_form_success",
      formSource: "main-contact",
      submissionId: "3f2b8c1e-5d4a-4b6f-9a7c-1e2d3c4b5a69",
      conversionKind: "accepted_lead",
    });
    assertIdentity(browser.sent[3]!, "/contact/");
    const again = await collectPageView(init);
    expect(again).toMatchObject({ ok: true, sent: false, duplicate: true });
    expect(browser.sent).toHaveLength(4);
  });

  it("reuses the page view event id for the engaged follow-up", async () => {
    const browser = installBrowser("/parkour/");
    const init = initFor(browser.fetchImpl);
    const token = beginPageEngagement("/parkour/");
    await collectPageView(init);
    expect(signalPageEngaged(token)).toBe("follow-up");
    const eventId = pageViewEventIdFor(token);
    expect(eventId).toBe(browser.sent[0]?.eventId);
    await collectMeasurementEvent(
      buildMeasurementEvent("page_view", { currentPath: "/parkour/", engaged: true, eventId }, init),
      init,
    );
    expect(browser.sent[1]).toMatchObject({ event: "page_view", eventId, engaged: true, currentPath: "/parkour/" });
    expect(browser.sent[0]?.engaged).toBeUndefined();
  });

  it("keeps the first channel and never treats this site as a referral", async () => {
    const browser = installBrowser("/");
    const init = initFor(browser.fetchImpl);
    await collectMeasurementEvent(
      buildMeasurementEvent(
        "page_view",
        { currentPath: "/", referrer: "https://www.google.com/search" },
        init,
      ),
      init,
    );
    await collectMeasurementEvent(
      buildMeasurementEvent(
        "page_view",
        { currentPath: "/about/", referrer: "https://www.springfieldwarriorsports.com/", eventId: "sws-second-page-view-id" },
        init,
      ),
      init,
    );
    expect(browser.sent[0]?.channel).toBe("organic");
    expect(browser.sent[1]?.channel).toBe("organic");
    expect(browser.session.getItem(SESSION_CHANNEL_KEY)).toBe("organic");
    expect(JSON.stringify([...Array(browser.session.length)].map((_, index) => browser.session.key(index)))).not.toContain(SID);
    browser.session.removeItem(SESSION_CHANNEL_KEY);
    const own = buildMeasurementEvent(
      "page_view",
      { currentPath: "/", referrer: "https://www.springfieldwarriorsports.com/kids-classes/" },
      init,
    );
    expect(own.channel).toBe("direct");
    browser.session.removeItem(SESSION_CHANNEL_KEY);
    const preview = buildMeasurementEvent(
      "page_view",
      { currentPath: "/", referrer: "https://springfield-warrior-sports-git.vercel.app/" },
      init,
    );
    expect(preview.channel).toBe("direct");
  });

  it("flags automation for webdriver and the bot cookie, without a visitor id", async () => {
    const browser = installBrowser("/");
    browser.fetchImpl.mockClear();
    const nav = (globalThis as { window: { navigator: { webdriver: boolean } } }).window.navigator;
    nav.webdriver = true;
    const flagged = buildMeasurementEvent("page_view", { currentPath: "/" }, initFor(browser.fetchImpl));
    expect(flagged.automation).toBe(true);
    const bot = buildMeasurementEvent(
      "page_view",
      { currentPath: "/" },
      { ...initFor(browser.fetchImpl), cookieHeader: "ff_bot=1" },
    );
    expect(bot.automation).toBe(true);
    expect(bot.visitorId).toBeNull();
    expect(bot.sessionId).toBeNull();
  });

  it("classifies phone and contact links and ignores square links", async () => {
    expect(isContactHref("/contact/")).toBe(true);
    expect(isContactHref("/contact/#form")).toBe(true);
    expect(isContactHref("https://square.link/u/GmmQ7iuL")).toBe(false);
    expect(isContactHref("tel:+14170000000")).toBe(false);
    expect(isContactHref("sms:+14170000000")).toBe(false);

    const trust = fakeEl("a", { href: "tel:+14170000000" }, fakeEl("div", { class: "trust trust-bar" }));
    const menu = fakeEl(
      "a",
      { href: "/contact/", class: "menu-only" },
      fakeEl("nav", { class: "nav-links" }, fakeEl("header", { class: "site-header" })),
    );
    const bar = fakeEl("a", { href: "tel:+14170000000" }, fakeEl("div", { class: "call-bar" }));
    expect(ctaLocationFor(trust as unknown as Element)).toBe("hero");
    expect(ctaLocationFor(menu as unknown as Element)).toBe("mobile_menu");
    expect(ctaLocationFor(bar as unknown as Element)).toBe("sticky_bar");

    const browser = installBrowser("/");
    const stop = bindJourneyInteractions();
    browser.click(trust);
    browser.click(menu);
    await vi.waitFor(() => expect(browser.sent).toHaveLength(2));
    expect(browser.sent.map((event) => event.event)).toEqual(["click_to_call", "contact_click"]);
    expect(browser.sent[0]?.ctaLocation).toBe("hero");
    expect(browser.sent[1]?.ctaLocation).toBe("mobile_menu");
    stop();
  });
});

describe("form attribution", () => {
  const ctx = {
    clientSubmissionId: "11111111-1111-4111-8111-111111111111",
    formStartedAt: Date.parse("2026-11-02T12:00:00Z"),
    now: Date.parse("2026-11-02T12:01:00Z"),
    pageUrl: "https://www.springfieldwarriorsports.com/contact/",
    search: "?utm_source=google&utm_medium=cpc",
    referrer: "https://www.google.com/",
    cookie: COOKIE,
  };
  const values = (): FieldValues => ({
    first: "Ada",
    last: "Lovelace",
    email: "ada@example.com",
    phone: "4175550100",
    message: "Hello",
    honeypot: "",
    extras: [],
    children: [],
  });

  it("puts ff_vid and ff_sid on the attribution envelope and leaves the lead fields alone", () => {
    const body = buildBody("main-contact", "Contact", values(), ctx);
    expect(body.siteKey).toBe(SITE_KEY);
    expect(body.formKey).toBe("main-contact");
    expect(body.email).toBe("ada@example.com");
    expect(body.utm).toEqual({ source: "google", medium: "cpc", campaign: "", term: "", content: "" });
    expect(body.attribution.visitor_id).toBe(VID);
    expect(body.attribution.session_id).toBe(SID);
    expect(body.attribution.site_key).toBe(SITE_KEY);
    expect(JSON.stringify(body.attribution)).not.toContain("ada@example.com");
    expect(JSON.stringify(body.attribution)).not.toContain("Hello");
    expect(JSON.stringify(body.attribution)).not.toContain("4175550100");
  });

  it("fires lead_form_success for success and received, with the same session id", async () => {
    const browser = installBrowser("/contact/");
    const uuid = "3f2b8c1e-5d4a-4b6f-9a7c-1e2d3c4b5a69";
    const leads: Array<{ attribution?: { session_id?: string } }> = [];
    const leadFetch = vi.fn(async (_url: string, init?: RequestInit) => {
      leads.push(JSON.parse(String(init?.body ?? "{}")));
      return new Response(JSON.stringify({ ok: true, id: uuid, conversionEligible: true }), { status: 200 });
    });
    vi.stubGlobal("fetch", browser.fetchImpl);
    const attempt = new SubmissionAttempt(() => "22222222-2222-4222-8222-222222222222");
    const success = await submitLead("main-contact", "Contact", values(), {
      hostname: "www.springfieldwarriorsports.com",
      fetchImpl: leadFetch as unknown as typeof fetch,
      attempt,
      ctx,
    });
    expect(success.kind).toBe("success");
    expect(leads[0]?.attribution?.session_id).toBe(SID);
    await vi.waitFor(() => expect(browser.sent.at(-1)?.event).toBe("lead_form_success"));
    expect(browser.sent.at(-1)).toMatchObject({
      event: "lead_form_success",
      sessionId: SID,
      visitorId: VID,
      currentPath: "/contact/",
    });

    browser.sent.length = 0;
    const receivedFetch = vi.fn(async () => new Response(JSON.stringify({ ok: false, saved: true, id: uuid }), { status: 503 }));
    const received = await submitLead("main-contact", "Contact", values(), {
      hostname: "www.springfieldwarriorsports.com",
      fetchImpl: receivedFetch as unknown as typeof fetch,
      attempt: new SubmissionAttempt(() => "33333333-3333-4333-8333-333333333333"),
      ctx,
    });
    expect(received.kind).toBe("received");
    await vi.waitFor(() => expect(browser.sent.map((event) => event.event)).toEqual(["lead_form_success"]));

    browser.sent.length = 0;
    const missed = await submitLead("main-contact", "Contact", values(), {
      hostname: "www.springfieldwarriorsports.com",
      fetchImpl: (async () => new Response("nope", { status: 502 })) as unknown as typeof fetch,
      attempt: new SubmissionAttempt(() => "44444444-4444-4444-8444-444444444444"),
      ctx,
    });
    expect(missed.kind).toBe("unconfirmed");
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(browser.sent).toEqual([]);
  });
});

type FakeEl = {
  tag: string;
  attrs: Record<string, string>;
  parentElement: FakeEl | null;
  classList: { contains: (name: string) => boolean };
  getAttribute: (name: string) => string | null;
  closest: (selector: string) => FakeEl | null;
};

function fakeEl(tag: string, attrs: Record<string, string>, parent: FakeEl | null = null): FakeEl {
  const node: FakeEl = {
    tag,
    attrs,
    parentElement: parent,
    classList: { contains: (name) => (attrs.class ?? "").split(/\s+/).includes(name) },
    getAttribute: (name) => attrs[name] ?? null,
    closest: () => null,
  };
  node.closest = (selector) => {
    const parts = selector.split(",").map((part) => part.trim());
    let current: FakeEl | null = node;
    while (current) {
      const here = current;
      if (parts.some((part) => (part.startsWith(".") ? here.classList.contains(part.slice(1)) : here.tag === part))) {
        return here;
      }
      current = here.parentElement;
    }
    return null;
  };
  return node;
}
