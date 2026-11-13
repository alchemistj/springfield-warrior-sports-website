const MAX_FORWARD_BODY_BYTES = 32_000;
export const CLIENT_USER_AGENT_HEADER = "x-ff-client-user-agent";
export const MAX_CLIENT_USER_AGENT_CHARS = 1024;

export function capClientUserAgent(value: string): string {
  return value.trim().slice(0, MAX_CLIENT_USER_AGENT_CHARS);
}

/** Isolated Reports collect ingest. The browser never calls this URL. */
export const REPORTS_MEASUREMENT_COLLECT_URL =
  "https://ff-reports-analytics.vercel.app/api/measurement/collect";

export const MEASUREMENT_SITE_KEY = "springfield-warrior-sports-website";
export const PRODUCTION_MEASUREMENT_HOST = "www.springfieldwarriorsports.com";

export const MEASUREMENT_ACCEPTED_CONTRACT_VERSIONS = ["ff-measure.v1", "ff-measurement-v1"] as const;

/** Reports rejects any other key. `engaged` and `automation` are included only when true. */
export const MEASUREMENT_FORWARD_KEYS = [
  "contractVersion",
  "siteKey",
  "environment",
  "event",
  "eventId",
  "occurredAt",
  "visitorId",
  "sessionId",
  "landingPath",
  "currentPath",
  "referrer",
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "gclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "channel",
  "device",
  "citySlug",
  "serviceSlug",
  "ctaLocation",
  "formSource",
  "submissionId",
  "conversionKind",
  "attributionConfidence",
  "engaged",
  "automation",
  "entry",
] as const;

const ALLOWED_KEYS = new Set<string>(MEASUREMENT_FORWARD_KEYS);

export type MeasurementForwardEnvironment = "production" | "preview" | "development";

export type ForwardMeasurementResult = {
  status: number;
  body: string;
  contentType: string;
};

function byteLength(value: string): number {
  if (typeof Buffer !== "undefined") return Buffer.byteLength(value, "utf8");
  return new TextEncoder().encode(value).length;
}

export function serializeMeasurementBody(body: unknown): string {
  if (typeof body === "string") return body;
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(body)) return body.toString("utf8");
  if (body == null) return "";
  if (typeof body === "object") return JSON.stringify(body);
  return String(body);
}

export function measurementHeaderValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0]?.trim() || "";
  return typeof value === "string" ? value.trim() : "";
}

export function environmentFromVercelEnv(vercelEnv: string | undefined): MeasurementForwardEnvironment {
  if (vercelEnv === "production") return "production";
  if (vercelEnv === "preview") return "preview";
  return "development";
}

/** Production measurement is only the public www host. Previews are not production. */
export function isProductionSiteOrigin(origin: string): boolean {
  const trimmed = origin.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return false;
    return url.hostname.toLowerCase() === PRODUCTION_MEASUREMENT_HOST;
  } catch {
    return false;
  }
}

export function measurementCollectHealth() {
  return {
    ok: true,
    ingest: "/api/site-events/",
    upstream: REPORTS_MEASUREMENT_COLLECT_URL,
    siteKey: MEASUREMENT_SITE_KEY,
    acceptedContractVersions: [...MEASUREMENT_ACCEPTED_CONTRACT_VERSIONS],
    canonicalContractVersion: "ff-measure.v1",
    methods: ["POST"],
    originRewrite: "none",
    preview: "accepted_locally",
  };
}

function jsonResult(status: number, body: unknown): ForwardMeasurementResult {
  return {
    status,
    body: JSON.stringify(body),
    contentType: "application/json",
  };
}

function skipped(reason: string): ForwardMeasurementResult {
  return jsonResult(202, {
    ok: true,
    stored: false,
    skipped: reason,
    originRewrite: "none",
  });
}

function isForwardScalar(value: unknown): boolean {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

/** Keep the Reports allowlist only. Nested objects and unknown keys never leave this server. */
export function allowlistMeasurementPayload(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of MEASUREMENT_FORWARD_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) continue;
    const value = input[key];
    if (!isForwardScalar(value)) continue;
    if ((key === "engaged" || key === "automation") && value !== true) continue;
    out[key] = value;
  }
  return out;
}

/**
 * Forward a same-origin measurement POST to Reports collect.
 * Sets `environment` from `VERCEL_ENV` (Vercel sets this; it is not a secret).
 * Production events are forwarded only when the Origin host is
 * www.springfieldwarriorsports.com. Preview and local events return 202 and
 * are not forwarded: FF Reports does not know this site yet, and a rejected
 * preview forward would show as a console error. No ingest token is used.
 */
export async function forwardMeasurementCollect(input: {
  body: unknown;
  origin?: string;
  vercelEnv?: string;
  userAgent?: string;
  fetchImpl?: typeof fetch;
}): Promise<ForwardMeasurementResult> {
  const raw = serializeMeasurementBody(input.body);
  if (byteLength(raw) > MAX_FORWARD_BODY_BYTES) {
    return jsonResult(413, { error: "Payload too large" });
  }

  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    return jsonResult(400, { ok: false, error: "Malformed JSON body" });
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return jsonResult(400, { ok: false, error: "Malformed JSON body" });
  }

  const payload = allowlistMeasurementPayload(parsed as Record<string, unknown>);
  const environment = environmentFromVercelEnv(input.vercelEnv);
  const origin = input.origin?.trim() || "";
  // Preview returns 202 locally. Reports answers 403 "Unknown site" until the
  // Reports architect registers this siteKey, and that 403 is a console error.
  if (environment !== "production") return skipped(environment === "preview" ? "preview" : "development");
  if (!isProductionSiteOrigin(origin)) return skipped("non_production_host");

  payload.siteKey = MEASUREMENT_SITE_KEY;
  payload.environment = environment;
  for (const key of Object.keys(payload)) {
    if (!ALLOWED_KEYS.has(key)) delete payload[key];
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (origin) headers.Origin = origin;
  const clientUserAgent = capClientUserAgent(input.userAgent || "");
  if (clientUserAgent) headers[CLIENT_USER_AGENT_HEADER] = clientUserAgent;

  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const response = await fetchImpl(REPORTS_MEASUREMENT_COLLECT_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    return {
      status: response.status,
      body: await response.text(),
      contentType: response.headers.get("content-type") || "application/json",
    };
  } catch {
    return jsonResult(502, { ok: false, error: "Upstream unavailable" });
  }
}
