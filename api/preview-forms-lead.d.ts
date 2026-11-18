export const config: { maxDuration: number; api: { bodyParser: boolean } };
export const MAX_REQUEST_BYTES: number;
export const MAX_RESPONSE_BYTES: number;
export const RELAY_TIMEOUT_MS: number;
export function ownOrigin(request: Request): string | null;
export function handlePreviewLead(
  request: Request,
  env?: { VERCEL_ENV?: string; FORMS_PREVIEW_LEAD_URL?: string },
  fetchImpl?: typeof fetch,
): Promise<Response>;
export default function handler(req: unknown, res: unknown): Promise<void>;
