// Preview-only relay for the contact form: Vercel Node serverless function at /api/preview-forms-lead.
// Mirrors alchemistj/window-dudes `api/preview-forms-lead.js` (root `api/` function next to a static Astro site),
// minus its Vercel OIDC and acceptance-probe parts.
//
// The browser on a *.vercel.app preview posts here. This forwards the JSON body to the Central Forms PREVIEW runtime
// (`FORMS_PREVIEW_LEAD_URL`, set in the Vercel project's Preview env, never in code) with `Origin` set to the
// request's own origin: Central Forms rejects a request without Origin and only accepts origins registered on
// the preview destination. It answers 404 in production (`VERCEL_ENV === "production"`) or when the URL is unset,
// and it never knows the production endpoint.
import { Readable } from "node:stream";

export const config = { maxDuration: 60, api: { bodyParser: false } };

export const MAX_REQUEST_BYTES = 100_000;
export const MAX_RESPONSE_BYTES = 256 * 1024;
export const RELAY_TIMEOUT_MS = 40_000;

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });

/** The request's own origin, from the host headers Vercel sets. Only *.vercel.app hosts qualify. */
export function ownOrigin(request) {
  let host;
  try {
    host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host).split(",")[0].trim().toLowerCase();
  } catch {
    return null;
  }
  return host.endsWith(".vercel.app") ? `https://${host}` : null;
}

async function readLimited(request, limit) {
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > limit) throw new RangeError("body_limit");
  return new TextDecoder().decode(bytes);
}

export async function handlePreviewLead(request, env = process.env, fetchImpl = fetch) {
  const target = (env.FORMS_PREVIEW_LEAD_URL ?? "").trim();
  if (env.VERCEL_ENV === "production" || !target) return json(404, { ok: false, error: "Not found" });
  if (request.method !== "POST") return json(405, { ok: false, error: "Method not allowed" });

  const origin = ownOrigin(request);
  const claimed = request.headers.get("origin");
  if (!origin || (claimed && claimed !== origin)) return json(403, { ok: false, error: "Forbidden" });

  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return json(415, { ok: false, reason: "validation", message: "Form request must be JSON." });
  }
  let text;
  try {
    text = await readLimited(request, MAX_REQUEST_BYTES);
  } catch {
    return json(413, { ok: false, reason: "validation", message: "Form request is too large." });
  }
  try {
    JSON.parse(text);
  } catch {
    return json(400, { ok: false, reason: "validation", message: "Body must be JSON." });
  }

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), RELAY_TIMEOUT_MS);
  try {
    const upstream = await fetchImpl(target, {
      method: "POST",
      redirect: "error",
      headers: { "Content-Type": "application/json", Accept: "application/json", Origin: origin },
      body: text,
      signal: ctl.signal,
    });
    const raw = (await upstream.text()).slice(0, MAX_RESPONSE_BYTES);
    let payload = null;
    try {
      payload = JSON.parse(raw);
    } catch {
      /* not JSON */
    }
    if (payload === null) return json(502, { ok: false, error: "Preview Forms returned an unusable response" });
    return json(upstream.status, payload);
  } catch {
    return ctl.signal.aborted ? json(504, { ok: false, error: "Preview Forms request timed out" }) : json(502, { ok: false, error: "Unable to reach Preview Forms" });
  } finally {
    clearTimeout(timer);
  }
}

function nodeHeaders(source) {
  const headers = new Headers();
  for (const key of ["host", "x-forwarded-host", "origin", "content-type", "content-length"]) {
    const value = source?.[key];
    if (Array.isArray(value)) headers.set(key, value.join(","));
    else if (typeof value === "string") headers.set(key, value);
  }
  return headers;
}

export default async function handler(req, res) {
  const host = typeof req.headers.host === "string" ? req.headers.host : "invalid";
  const request = new Request(`https://${host}${req.url || "/api/preview-forms-lead"}`, {
    method: req.method || "GET",
    headers: nodeHeaders(req.headers),
    ...(req.method === "GET" || req.method === "HEAD" ? {} : { body: Readable.toWeb(req), duplex: "half" }),
  });
  const response = await handlePreviewLead(request);
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}
