import { describe, expect, it, vi } from "vitest";
import { handleSiteEvents } from "../../api/site-events";
import {
  CLIENT_USER_AGENT_HEADER,
  MEASUREMENT_SITE_KEY,
  REPORTS_MEASUREMENT_COLLECT_URL,
  forwardMeasurementCollect,
} from "../../server/lib/forwardMeasurementCollect";

const sample = {
  contractVersion: "ff-measure.v1",
  siteKey: "someone-else",
  event: "page_view",
  eventId: "sws-11111111-1111-4111-8111-111111111111",
  occurredAt: "2026-11-13T00:00:00.000Z",
  visitorId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  sessionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  currentPath: "/contact/",
  email: "person@example.com",
  message: "call me",
};

describe("measurement forwarder", () => {
  it("forwards the visitor user agent and drops anything outside the allowlist", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 202 }));
    const result = await forwardMeasurementCollect({
      body: sample,
      origin: "https://preview.example.vercel.app",
      userAgent: "Mozilla/5.0 Chrome/131.0.0.0",
      vercelEnv: "preview",
      fetchImpl,
    });
    expect(result.status).toBe(202);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(REPORTS_MEASUREMENT_COLLECT_URL);
    const headers = init.headers as Record<string, string>;
    expect(headers[CLIENT_USER_AGENT_HEADER]).toBe("Mozilla/5.0 Chrome/131.0.0.0");
    const forwarded = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(forwarded.siteKey).toBe(MEASUREMENT_SITE_KEY);
    expect(forwarded.environment).toBe("preview");
    expect(forwarded.visitorId).toBe(sample.visitorId);
    expect(forwarded.sessionId).toBe(sample.sessionId);
    expect(forwarded.currentPath).toBe("/contact/");
    expect(forwarded.email).toBeUndefined();
    expect(forwarded.message).toBeUndefined();
  });

  it("forwards production only from the public www host", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
    const skipped = await forwardMeasurementCollect({
      body: sample,
      origin: "https://springfield-warrior-sports-website.vercel.app",
      userAgent: "Mozilla/5.0",
      vercelEnv: "production",
      fetchImpl,
    });
    expect(skipped.status).toBe(202);
    expect(JSON.parse(skipped.body).skipped).toBe("non_production_host");
    expect(fetchImpl).not.toHaveBeenCalled();

    const sent = await forwardMeasurementCollect({
      body: sample,
      origin: "https://www.springfieldwarriorsports.com",
      userAgent: "Mozilla/5.0",
      vercelEnv: "production",
      fetchImpl,
    });
    expect(sent.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("passes the client user agent through the site-events handler", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 202 }));
    const result = await handleSiteEvents({
      method: "POST",
      body: JSON.stringify(sample),
      origin: "https://www.springfieldwarriorsports.com",
      userAgent: "  Mozilla/5.0 Journey  ",
      vercelEnv: "production",
      fetchImpl,
    });
    expect(result.status).toBe(202);
    const headers = (fetchImpl.mock.calls[0]?.[1] as RequestInit).headers as Record<string, string>;
    expect(headers[CLIENT_USER_AGENT_HEADER]).toBe("Mozilla/5.0 Journey");
  });
});
