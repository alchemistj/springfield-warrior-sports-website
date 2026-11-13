# Spec: journey tracking (Rule 14.1)

The launch blocker from the 12–13 Nov launch QA (`docs/qa/launch-qa.md`). Rule 14.1 in `docs/sop/astro-full-build-rules.md` is the standard; read it in full first.

## Copy from sites that already ship it

- `alchemistj/window-dudes`: `src/lib/attribution/bootstrap.ts` (browser module), `api/site-events.ts` (same-origin endpoint) and `server/lib/forwardMeasurementCollect.ts` (forwarder to FF Reports `/api/measurement/collect`, passing `x-ff-client-user-agent`).
- `alchemistj/jennarhae` PR #3, `alchemistj/a-new-you` PRs #3 and #5: the same pattern on recent Astro builds. Prefer their shape where they differ from Window Dudes.
- `alchemistj/sra-roofing-website` `middleware.ts`: identity cookies, the bot marker and entry tags.
- Identity cookies: `alchemistj/ff-split-testing` `packages/website-runtime` and `docs/client-site-integration.md`.

## Build

1. **`middleware.ts`** (TypeScript, not `.js`). HTML page requests only, never assets or `/api/*`:
   - `ff_vid`: visitor ID, 180 days.
   - `ff_sid`: session ID, 30 minutes, renewed on every page load.
   - Bots get the 2-minute `ff_bot=1` marker instead, never `ff_vid`/`ff_sid`.
   - Entry tags: no Google Business Profile vanity path is confirmed for this site yet, so ship the entry-tag code with an empty map. Add a comment saying where `/Springfield` → `gbp-springfield` would go.
   - Pages must stay cached and fast. Run mobile PageSpeed on `/` before and after; performance stays at or above 91 (today 94).
2. **Browser module.** Events go to same-origin `/api/site-events` only, sent after load with `sendBeacon` or keepalive fetch. Every event carries `ff_vid`, `ff_sid`, the page path and `entry`:
   - `page_view` on every page.
   - `click_to_call` on every `tel:` link, with `ctaLocation`: `header`, `mobile_menu`, `hero`, `cta_band`, `main`, `footer` or `sticky_bar`. The trust bar counts as `hero`.
   - `contact_click` on every link to `/contact/`, with `ctaLocation`.
   - `lead_form_success` after Central Forms accepts a lead. That's the `success` result in `src/lib/forms.ts`, and also `received`; never `unconfirmed`.
   - No `text_click` (the site has no `sms:` links) and no `scheduler_opened` (no booking widget; the Square and waiver links are not schedulers).
   - `engaged`: once per page view, as in Rule 14.1, reusing the page view's `eventId`.
   - `automation: true` on the Rule 14.1 signals, or when `ff_bot=1` is set.
   - The first channel goes in sessionStorage; the site's own host never counts as a referral.
   - No PII: no names, emails, phones or form text.
3. **`api/site-events.ts`** forwarder to FF Reports, copied from the references:
   - `siteKey` `springfield-warrior-sports-website`, production host `www.springfieldwarriorsports.com`.
   - Any credential is read from an env var, never hard-coded. List the env var names in the PR so Josh can set them on Vercel. FF Reports registration is being handled by the Reports architect.
   - The relay must work on Preview too. On a preview it can forward to FF Reports, which ignores preview events, or return 202 without forwarding. Either is fine, but say which.
4. **Forms:** send `ff_vid` and `ff_sid` in the attribution envelope of every Central Forms submission (Rule 14), in the exact field names the reference sites send. Change nothing else in the Central Forms wiring: `siteKey`, `formKey`s, field names, retry id, thank-you redirects, host gate and the `received` handling from #11.

## Done means

- On this PR's Vercel preview, in Playwright or the network panel: browse two pages, tap a phone link and a contact link, and submit one form. Only to `support+swstest@fluidframemarketing.com`; never the client.
  - Show each event's request to `/api/site-events`, with `ff_vid` and `ff_sid`.
  - Show that the form submission carries the same `ff_sid`.
- No cookies set on `/_astro/*` or `/api/*`. A bot user agent gets `ff_bot=1` and no IDs.
- `vitest` passes, with unit tests for the middleware cookie rules and the event payloads. `astro build` passes.
- No console errors on any page. Mobile PageSpeed on `/` at or above 91.
- Report: a table of events and where they fire, the env var names, the before and after PageSpeed scores, preview links, and the model used.
