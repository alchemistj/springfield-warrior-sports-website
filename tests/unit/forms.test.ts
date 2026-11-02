import { describe, expect, it, vi } from "vitest";
import {
  LEAD_URL,
  PRODUCTION_HOST,
  SITE_KEY,
  SubmissionAttempt,
  buildBody,
  classifyResponse,
  fireConversion,
  resetConversions,
  resolveEndpoint,
  submitLead,
  type FieldValues,
} from "../../src/lib/forms";
import { events } from "../../src/data/events";

const ctx = {
  clientSubmissionId: "11111111-1111-4111-8111-111111111111",
  formStartedAt: Date.parse("2026-11-02T12:00:00Z"),
  now: Date.parse("2026-11-02T12:01:00Z"),
  pageUrl: "https://www.springfieldwarriorsports.com/contact/",
  search: "?utm_source=google&utm_medium=cpc",
  referrer: "https://www.google.com/",
};

const baseValues = (): FieldValues => ({
  first: "Ada",
  last: "Lovelace",
  email: "ada@example.com",
  phone: "4175550100",
  message: "Hello",
  honeypot: "",
  extras: [],
  children: [],
});

describe("host gate", () => {
  it("posts production only from the live host", () => {
    expect(resolveEndpoint(PRODUCTION_HOST)).toEqual({ kind: "direct", url: LEAD_URL });
    expect(resolveEndpoint("springfieldwarriorsports.com").kind).toBe("none");
    expect(resolveEndpoint("localhost").kind).toBe("none");
    expect(resolveEndpoint("127.0.0.1").kind).toBe("none");
    expect(resolveEndpoint("preview.vercel.app")).toEqual({ kind: "relay", url: "/api/preview-forms-lead/" });
  });
});

describe("lead body", () => {
  it("sends the event, name parts, and top-level contact fields", () => {
    const body = buildBody("main-contact", "Contact", { ...baseValues(), extras: [{ key: "subject", label: "Subject", value: "Parties" }] }, ctx);
    expect(body.siteKey).toBe(SITE_KEY);
    expect(body.formKey).toBe("main-contact");
    expect(body.name).toBe("Ada Lovelace");
    expect(body.customFields.event).toEqual({ label: "Event", value: "Contact", type: "text" });
    expect(body.customFields.firstName?.value).toBe("Ada");
    expect(body.customFields.lastName?.value).toBe("Lovelace");
    expect(body.customFields.subject).toEqual({ label: "Subject", value: "Parties", type: "text" });
    expect(body.utm.source).toBe("google");
  });

  it("flattens up to four competitors", () => {
    const body = buildBody(
      "competition-registration",
      "September 19, 2026 CSNA Competition",
      {
        ...baseValues(),
        message: "",
        children: [
          { name: "Kid One", gender: "Female", birthday: "2016-01-02", division: "8-9 year old girls" },
          { name: "Kid Two", gender: "Male", birthday: "2014-04-04", division: "10-11 year old boys" },
        ],
      },
      ctx,
    );
    expect(body.customFields.child1Name).toEqual({ label: "Competitor 1 name", value: "Kid One", type: "text" });
    expect(body.customFields.child2Division?.value).toBe("10-11 year old boys");
    expect(body.customFields.child3Name).toBeUndefined();
  });

  it("covers every live form key", () => {
    const keys = new Set(events.map((event) => event.formKey));
    expect([...keys].sort()).toEqual([
      "birthday-party",
      "camp-registration",
      "competition-registration",
      "event-waitlist",
      "main-contact",
      "personal-training",
    ]);
    for (const event of events) {
      const body = buildBody(event.formKey, event.event, baseValues(), ctx);
      expect(body.customFields.event?.value).toBe(event.event);
      expect(body.formKey).toBe(event.formKey);
    }
  });
});

describe("responses and retries", () => {
  const uuid = "3f2b8c1e-5d4a-4b6f-9a7c-1e2d3c4b5a69";

  it("accepts only ok plus a UUID, and converts once", () => {
    resetConversions();
    expect(classifyResponse(200, { ok: true, id: uuid, conversionEligible: true }).kind).toBe("success");
    expect(classifyResponse(200, { ok: true, id: "nope" }).kind).toBe("unconfirmed");
    expect(classifyResponse(400, { ok: false }).kind).toBe("invalid");
    expect(classifyResponse(429, {}).kind).toBe("rate_limited");
    const gtag = vi.fn();
    (globalThis as { gtag?: typeof gtag }).gtag = gtag;
    fireConversion(uuid);
    fireConversion(uuid);
    expect(gtag).toHaveBeenCalledTimes(1);
  });

  it("reuses the submission id until success", async () => {
    const attempt = new SubmissionAttempt(() => "22222222-2222-4222-8222-222222222222");
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: false }), { status: 500 })) as unknown as typeof fetch;
    await submitLead("main-contact", "Contact", baseValues(), {
      hostname: "localhost",
      fetchImpl,
      attempt,
      ctx,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
    const prodFetch = vi.fn(async () => new Response("nope", { status: 502 })) as unknown as typeof fetch;
    const first = await submitLead("main-contact", "Contact", baseValues(), {
      hostname: PRODUCTION_HOST,
      fetchImpl: prodFetch,
      attempt,
      ctx,
    });
    const second = await submitLead("main-contact", "Contact", baseValues(), {
      hostname: PRODUCTION_HOST,
      fetchImpl: prodFetch,
      attempt,
      ctx,
    });
    expect(first.kind).toBe("unconfirmed");
    expect(second.kind).toBe("unconfirmed");
    const calls = (prodFetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const bodies = calls.map((call) => JSON.parse(String((call[1] as RequestInit).body)) as { clientSubmissionId?: string });
    expect(bodies[0]?.clientSubmissionId).toBeTruthy();
    expect(bodies[0]?.clientSubmissionId).toBe(bodies[1]?.clientSubmissionId);
    expect(calls[0]?.[0]).toBe(LEAD_URL);
  });
});
