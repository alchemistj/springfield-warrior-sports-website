// Central Forms transport. Pure functions so Vitest can cover them.
// The literal production endpoint must survive in the shipped bundle.

export const LEAD_URL = "https://forms.fluidframemarketing.com/api/lead";
export const PREVIEW_RELAY_URL = "/api/preview-forms-lead/";
export const PRODUCTION_HOST = "www.springfieldwarriorsports.com";
export const SITE_KEY = "springfield-warrior-sports-website";
export const TIMEOUT_MS = 45_000;

export type Endpoint = { kind: "direct"; url: string } | { kind: "relay"; url: string } | { kind: "none" };

export function resolveEndpoint(hostname: string): Endpoint {
  const host = hostname.trim().toLowerCase();
  if (host === PRODUCTION_HOST) return { kind: "direct", url: LEAD_URL };
  if (host.endsWith(".vercel.app")) return { kind: "relay", url: PREVIEW_RELAY_URL };
  return { kind: "none" };
}

export interface ExtraField {
  key: string;
  label: string;
  value: string;
}

export interface ChildRow {
  name: string;
  gender: string;
  birthday: string;
  division: string;
}

export interface FieldValues {
  first: string;
  last: string;
  email: string;
  phone: string;
  message: string;
  honeypot: string;
  extras: ExtraField[];
  children: ChildRow[];
}

export interface LeadContext {
  clientSubmissionId: string;
  formStartedAt: number;
  now: number;
  pageUrl: string;
  search: string;
  referrer: string;
}

export interface CustomField {
  label: string;
  value: string;
  type: "text";
}

export interface LeadBody {
  siteKey: string;
  formKey: string;
  clientSubmissionId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  honeypot: string;
  formStartedAt: string;
  submittedAt: string;
  pageUrl: string;
  referrer: string | null;
  utm: { source: string; medium: string; campaign: string; term: string; content: string };
  customFields: Record<string, CustomField>;
}

const clip = (value: string, max: number) => value.trim().slice(0, max);

export function buildBody(
  formKey: string,
  eventName: string,
  values: FieldValues,
  ctx: LeadContext,
): LeadBody {
  const q = new URLSearchParams(ctx.search);
  const utm = (key: string) => q.get(`utm_${key}`) ?? "";
  const customFields: Record<string, CustomField> = {
    event: { label: "Event", value: eventName, type: "text" },
  };
  if (values.first.trim()) customFields.firstName = { label: "First", value: clip(values.first, 100), type: "text" };
  if (values.last.trim()) customFields.lastName = { label: "Last", value: clip(values.last, 100), type: "text" };
  for (const extra of values.extras) {
    const value = clip(extra.value, 5000);
    if (!value) continue;
    customFields[extra.key] = { label: extra.label, value, type: "text" };
  }
  values.children.slice(0, 4).forEach((child, index) => {
    const n = index + 1;
    const rows: Array<[string, string, string]> = [
      [`child${n}Name`, `Competitor ${n} name`, child.name],
      [`child${n}Gender`, `Competitor ${n} gender`, child.gender],
      [`child${n}Birthday`, `Competitor ${n} birthday`, child.birthday],
      [`child${n}Division`, `Competitor ${n} division`, child.division],
    ];
    for (const [key, label, value] of rows) {
      const trimmed = clip(value, 200);
      if (trimmed) customFields[key] = { label, value: trimmed, type: "text" };
    }
  });
  return {
    siteKey: SITE_KEY,
    formKey,
    clientSubmissionId: ctx.clientSubmissionId,
    name: clip(`${values.first} ${values.last}`, 200),
    email: clip(values.email, 320),
    phone: clip(values.phone, 50),
    message: clip(values.message, 5000),
    honeypot: values.honeypot.trim(),
    formStartedAt: new Date(ctx.formStartedAt).toISOString(),
    submittedAt: new Date(ctx.now).toISOString(),
    pageUrl: ctx.pageUrl.slice(0, 2000),
    referrer: ctx.referrer ? ctx.referrer.slice(0, 2000) : null,
    utm: { source: utm("source"), medium: utm("medium"), campaign: utm("campaign"), term: utm("term"), content: utm("content") },
    customFields,
  };
}

export function hasContactMethod(values: Pick<FieldValues, "email" | "phone">): boolean {
  return values.email.trim() !== "" || values.phone.trim() !== "";
}

export type Outcome =
  | { kind: "success"; id: string; conversion: boolean }
  | { kind: "invalid" }
  | { kind: "rate_limited" }
  | { kind: "received"; id: string }
  | { kind: "unconfirmed" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function classifyResponse(status: number, json: unknown): Outcome {
  const body = json && typeof json === "object" ? (json as Record<string, unknown>) : null;
  if (status >= 200 && status < 300 && body && body["ok"] === true && typeof body["id"] === "string" && UUID_RE.test(body["id"])) {
    return { kind: "success", id: body["id"], conversion: body["duplicate"] !== true && body["conversionEligible"] === true };
  }
  if (status === 400 && body && body["ok"] === false && !body["saved"]) return { kind: "invalid" };
  if (status === 429) return { kind: "rate_limited" };
  // Central Forms stored the lead but email delivery is still pending (it retries and alerts an operator).
  // The visitor's message is in, so show it as received, keep the phone line, and fire no conversion.
  if (body && body["saved"] === true && typeof body["id"] === "string" && UUID_RE.test(body["id"])) return { kind: "received", id: body["id"] };
  return { kind: "unconfirmed" };
}

export class SubmissionAttempt {
  private id: string | null = null;
  constructor(private readonly makeId: () => string = () => crypto.randomUUID()) {}
  current(): string {
    this.id ??= this.makeId();
    return this.id;
  }
  reset(): void {
    this.id = null;
  }
}

const fired = new Set<string>();

/** Fires once per lead id. No-op when gtag has not been loaded yet. */
export function fireConversion(id: string): void {
  if (fired.has(id)) return;
  fired.add(id);
  const gtag = (globalThis as { gtag?: (event: string, name: string, params: Record<string, string>) => void }).gtag;
  if (typeof gtag === "function") gtag("event", "generate_lead", { transaction_id: id });
}

export function resetConversions(): void {
  fired.clear();
}

export type SubmitResult = Outcome | { kind: "not_sent" };

export interface SubmitDeps {
  hostname: string;
  fetchImpl: typeof fetch;
  attempt: SubmissionAttempt;
  ctx: Omit<LeadContext, "clientSubmissionId">;
  timeoutMs?: number;
}

export async function submitLead(
  formKey: string,
  eventName: string,
  values: FieldValues,
  deps: SubmitDeps,
): Promise<SubmitResult> {
  const endpoint = resolveEndpoint(deps.hostname);
  if (endpoint.kind === "none") return { kind: "not_sent" };
  const body = buildBody(formKey, eventName, values, { ...deps.ctx, clientSubmissionId: deps.attempt.current() });
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), deps.timeoutMs ?? TIMEOUT_MS);
  try {
    const res = await deps.fetchImpl(endpoint.url, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
    const json: unknown = await res.json().catch(() => null);
    const outcome = classifyResponse(res.status, json);
    if (outcome.kind === "success") {
      if (outcome.conversion) fireConversion(outcome.id);
      deps.attempt.reset();
    } else if (outcome.kind === "invalid" || outcome.kind === "received") {
      deps.attempt.reset();
    }
    return outcome;
  } catch {
    return { kind: "unconfirmed" };
  } finally {
    clearTimeout(timer);
  }
}
