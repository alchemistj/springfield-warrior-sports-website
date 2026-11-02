import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import { handlePreviewLead } from "../../api/preview-forms-lead.js";

const TARGET = "https://forms-preview.example.test/api/lead";
const HOST = "warrior-sports-git-preview.vercel.app";
const req = (init: { method?: string; origin?: string | null; host?: string; type?: string; body?: string } = {}) =>
  new Request(`https://${init.host ?? HOST}/api/preview-forms-lead`, {
    method: init.method ?? "POST",
    headers: {
      "content-type": init.type ?? "application/json",
      host: init.host ?? HOST,
      ...(init.origin === null ? {} : { origin: init.origin ?? `https://${HOST}` }),
    },
    body: (init.method ?? "POST") === "POST" ? (init.body ?? JSON.stringify({ siteKey: "springfield-warrior-sports-website" })) : undefined,
  });

describe("preview relay", () => {
  it("returns 404 in production and when the preview URL is unset", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    expect((await handlePreviewLead(req(), { VERCEL_ENV: "production", FORMS_PREVIEW_LEAD_URL: TARGET }, fetchImpl)).status).toBe(404);
    expect((await handlePreviewLead(req(), { VERCEL_ENV: "preview" }, fetchImpl)).status).toBe(404);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("forwards JSON only for its own vercel preview origin", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: true, id: "3f2b8c1e-5d4a-4b6f-9a7c-1e2d3c4b5a69" }), { status: 200 })) as unknown as typeof fetch;
    const body = JSON.stringify({ siteKey: "springfield-warrior-sports-website" });
    const response = await handlePreviewLead(req({ body }), { VERCEL_ENV: "preview", FORMS_PREVIEW_LEAD_URL: TARGET }, fetchImpl);
    expect(response.status).toBe(200);
    const init = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as RequestInit;
    expect(init.body).toBe(body);
    expect((init.headers as Record<string, string>).Origin).toBe(`https://${HOST}`);
    const env = { VERCEL_ENV: "preview", FORMS_PREVIEW_LEAD_URL: TARGET };
    expect((await handlePreviewLead(req({ origin: "https://evil.test" }), env, fetchImpl)).status).toBe(403);
    expect((await handlePreviewLead(req({ host: "www.springfieldwarriorsports.com" }), env, fetchImpl)).status).toBe(403);
  });

  it("does not contain the production endpoint", async () => {
    const src = await readFile("api/preview-forms-lead.js", "utf8");
    expect(src).not.toContain("forms.fluidframemarketing.com");
  });
});
