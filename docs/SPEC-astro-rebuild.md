# Spec: Springfield Warrior Sports — faithful rebuild on the Fluid Frame Astro system

Status: approved direction from Josh, 2 Nov 2026. Builder: Cursor via FF Architect.

## 0. Read first

1. `alchemistj/ff-architect` → `docs/sop/astro-full-build-rules.md`, **especially Rule 0.4
   (single-location venues)**. It is on PR #592 (branch `claude/astro-no-preview-protection`)
   until merged; read it from that branch.
2. `alchemistj/ff-architect` → `docs/sop/astro-first-frame-and-pagespeed.md` and
   `scripts/perf/first-frame-check.mjs`.
3. `alchemistj/ff-architect` → `docs/sop/central-forms-contact-form.md` (forms).
4. This repo's `source/` folder: the captured live site (section 2).

Where this spec and the SOPs disagree, **this spec wins for this client** (Josh's decisions
below), then Rule 0.4, then the rest of the SOPs.

## 1. What Josh decided

- **Faithful rebuild.** The current design and words were done by Josh's designers and copy team
  and are final. Match the live site's layout, colors, fonts, spacing, images and every word.
  Do not rewrite, shorten, "improve" or reorder copy. Do not redesign. The Astro system goes
  underneath: speed, first-frame hero, clean HTML, Central Forms.
- **Single-location venue (Rule 0.4).** A ninja / parkour gym in Springfield, MO. **Every URL
  stays exactly as it is now.** No `/springfield/...` paths, no city switcher, no city sections.
- **Add:** the hide-on-scroll header with a real hamburger menu on mobile (Rule 5, minus the
  switcher), the sticky mobile bottom bar (Rule 6: Call + one primary button, see §5), and a
  trust bar under the hero styled from what the site already shows (Rule 9, no "Serving [City]"
  line). No star ratings or review counts anywhere.
- **Thank-you pages stay** at their current URLs, with their Square pay links. Forms send the
  visitor there only after Central Forms confirms the submission (§6).
- **"Best Gyms in Springfield" stays** as an article at its current URL.
- **Mailchimp** is handled inside Central Forms (separate PR in `ff-contact-and-forms-filtering`).
  The site never talks to Mailchimp and holds no Mailchimp key.

## 2. Source material in this repo (`source/`)

| Path | What |
|---|---|
| `source/pages.json` | the 23 pages captured, path + title |
| `source/pages/<slug>/rendered.html` | full rendered HTML of the live page (Thrive markup; use for exact words, structure, colors, fonts, links) |
| `source/pages/<slug>/text.txt` | visible text of the page |
| `source/pages/<slug>/meta.json` | title, meta description, canonical, robots, H1, every link, every image (src + alt), background images, JSON-LD |
| `source/pages/<slug>/desktop.jpg`, `mobile.jpg` | full-page screenshots at 1440 px and 390 px. **The visual target.** |
| `source/media/` | original image files from the WordPress uploads, `manifest.tsv` maps file → URL used on the page |
| `source/forms/gf-<id>.json` | every live form: fields, labels, choices, required flags, button text, confirmation |
| `source/forms/mailchimp-feeds.json` | how WordPress sent each form to Mailchimp (reference only; Central Forms implements it) |
| `source/testimonials.json` | the 13 testimonials (Thrive Ovation) |
| `source/redirects-existing.tsv` | the 29 live 301 redirects |

`source/` is reference material. Don't import from it at runtime. Copy what you use into `src/`
(words into `src/data/`, images into `src/assets/`).

Images: use the local files in `source/media/`, optimized at build time. Never hot-link
WordPress uploads. The "Best Gyms" article hot-links three images from other websites
(`media/skipped.txt`). Don't hot-link them. Leave those image slots out and list them in the
PR report for Josh.

## 3. Pages and URLs (all unchanged)

Indexed (sitemap): `/`, `/birthday-parties/`, `/schedule-birthday-party/`, `/kids-classes/`,
`/parkour/`, `/fitness-classes/`, `/personal-training/`,
`/homeschool-sports-and-classes-springfield-mo/`, `/summer-camps-in-springfield-mo/`,
`/competitions/`, `/wnl-competitions/`, `/nerf-wars/`, `/laser-tag/`, `/about/`,
`/meet-the-team/`, `/best-gyms-in-springfield/`, `/contact/`.

Thank-you pages (built, `noindex`, not in sitemap or llms.txt): `/registered/`,
`/registered-for-wnl-competition/`, `/registered-for-csna-competition/`,
`/registered-for-day-camps/`, `/registered-for-summer-fun-competition/`,
`/thank-you-for-your-feedback/`. Keep their words and their Square links exactly.

Add (new, needed for SMS consent links): `/privacy-policy/`, `/terms/`,
`/text-messaging-terms/`. Use placeholder copy marked **"TBD — needs legal review"** in the
data file, `noindex` until Josh supplies text. If the forms don't include an SMS consent box
(the current ones don't), skip these three pages and say so in the report.

Keep each page's current `<title>`, meta description and H1 (from `meta.json`).

One route registry lists every published URL. Sitemap, robots, llms.txt and the link tests
read from it (Rule 3).

## 4. Architecture

Rule 1 as written: Astro 5 static, `@astrojs/vercel`, `trailingSlash: "always"`,
`build.inlineStylesheets: "always"`, Node 22, Tailwind 4, TypeScript strict, zero client JS by
default. Scripts `dev`, `build`, `preview`, `check`, `lint`, `test`. Commit the lockfile.

- `src/data/site.ts` (one-entry `cityConfig`-style config): business name, NAP phone
  `+14178947319` (display as on the live site), address as on the live site/contact page, hours
  if shown. **Check the footer/contact page for the exact address and phone text and use
  those.** It is the only phone number in the repo.
- `src/data/pages/*.ts|json`: words per page, copied word for word from `text.txt` /
  `rendered.html`.
- `src/data/events.ts`: one entry per form-backed event (§6).
- Canonical host `https://www.springfieldwarriorsports.com`. Apex → www, one 301.
- GA4 `G-DLZRG9QF8J` is on the live site. Load it per Rule 16 (after window load + 3 s or first
  interaction). If the live site uses GTM instead, keep the GTM container. Do not edit tags.
- Google Map on contact: deferred per Rule 10.
- JSON-LD: `SportsActivityLocation` (or `ExerciseGym`) + `LocalBusiness` with the NAP,
  `BreadcrumbList`, `FAQPage` where a page has FAQs. No ratings or review markup.

## 5. Header, mobile bar, trust bar, hero

- Header: same logo, links and order as the live header. Add hide-on-scroll (Rule 5) and a
  real hamburger `<button>` on mobile with the same links as desktop.
- Logo inline SVG or ≤ 4 KB inline image. If only a raster logo exists, inline a small
  optimized version and note it.
- Sticky mobile bottom bar (below `md`): **Call** (tel: NAP) and **Book a Party** →
  `/schedule-birthday-party/`. On `/schedule-birthday-party/` the second button jumps to the form
  anchor instead. Add bottom padding so it never covers the footer.
- Trust bar directly under the hero on every page, built from what the live hero/intro already
  shows (e.g. the tagline "Ninja and Parkour Gym", programs, phone as click-to-call). Only
  existing words. If the live site has nothing suitable, use the business name + tagline + phone
  and flag it.
- Hero per page: same photo, H1, subhead and buttons as the live page, rebuilt to the
  first-frame rules (inline AVIF hero first in `<body>`, `.atf-ready` marker, no preload,
  no CSS background hero).

## 6. Forms (Central Forms)

Follow `central-forms-contact-form.md` §4 exactly (body shape, `clientSubmissionId` reuse,
response handling, host gate, no-JS state, preview relay, literal endpoint string in the
bundle). Copy the `submitLead` pattern in §4e.

- Endpoint `https://forms.fluidframemarketing.com/api/lead`
- `siteKey`: `springfield-warrior-sports-website`
- Production host gate: exactly `www.springfieldwarriorsports.com`.
- Preview: same-origin relay `api/preview-forms-lead`, preview builds only, target from
  `FORMS_PREVIEW_LEAD_URL`. Must not exist or run in production.

Six forms (`formKey`), each one reusable component driven by data:

| formKey | Replaces | Pages | Fields (labels and choices exactly as `source/forms/gf-*.json`) | Success |
|---|---|---|---|---|
| `birthday-party` | GF 1 | `/schedule-birthday-party/` | name (first + last), birthday kid's name, email, phone, dates/times textarea, add-ons checkboxes, anything else | in-place message from gf-1 |
| `camp-registration` | GF 17 | `/summer-camps-in-springfield-mo/` | as gf-17 (parent first/last, email, phone, kid's name, age, T-shirt, camp weeks, allergies, siblings) | → `/registered-for-day-camps/` |
| `competition-registration` | GF 19, GF 10 | `/competitions/` (CSNA, gf-19 incl. repeater), `/wnl-competitions/` (WNL, gf-10) | as each source form | CSNA → `/registered-for-csna-competition/`; WNL → `/registered-for-wnl-competition/` |
| `personal-training` | GF 15 | `/personal-training/` | as gf-15 | in-place message from gf-15 |
| `event-waitlist` | GF 5, GF 6 | `/nerf-wars/`, `/laser-tag/` | name, email | in-place message from gf-5/gf-6 |
| `main-contact` | Thrive form | `/contact/` | first name, last name, email, subject, message (match the live form) | in-place "Thank you! We will be in touch shortly!" |

Events data (`src/data/events.ts`): one entry per form-backed event with `slug`, `formKey`,
`event` (display name, e.g. "2026 Summer Camp", "September 19, 2026 CSNA Competition",
"WNL Competition", "Nerf War Night", "Laser Tag Night", "Birthday Party Booking",
"Personal Training", "Contact"), the field set and choices, `thankYouPath` or in-place
message, and `open: boolean`. Opening next season is an edit to this file only.

Payload: name/email/phone/message top-level per §4a. Everything else in `customFields` with the
human label from the source form. **Always send `event`**:
`customFields.event = { label: "Event", value: <event display name>, type: "text" }`.
Central Forms uses it for the Mailchimp tag and the client reads it in the email.
Name fields: send `name` as "First Last", and also `firstName` / `lastName` customFields where
the form has separate parts (Mailchimp needs FNAME/LNAME).
Repeater (CSNA, several kids): numbered customFields `child1Name`, `child1Gender`,
`child1Birthday`, `child1Division` … up to 4 children, with "Add another competitor" and
"Remove" buttons. Labels "Competitor 1 name", etc.

Success flow: show success only on `ok:true` + UUID `id` (§4d). For forms with a `thankYouPath`,
then `location.assign(thankYouPath)`. Fire the conversion once
(`ok && !duplicate && conversionEligible`) **before** navigating. On every other outcome keep
the input, keep the id, and show "please call (417) …" with the tel: link.

Button text: keep the live wording (the live forms say "Submit" / "Notify Me"). Copy is final
(Rule 0.4).

reCAPTCHA: none. Honeypot field `website_url` (visually hidden, `tabindex="-1"`,
`autocomplete="off"`).

The form renders in the server HTML. Submit button starts `disabled` with
"Form loading… or call …" until the script binds; `<noscript>` message with the phone.

## 7. Redirects

`src/data/redirects.ts` + `vercel.json` with a test that keeps them in sync (Rule 15).

- Carry over all 29 rules in `source/redirects-existing.tsv`, each pointing straight at its
  final URL with a trailing slash, one hop, both slash forms of the source.
- `/school-day-off-solutions/` → `/summer-camps-in-springfield-mo/`.
- No-slash → slash for every page. Apex → www. http → https.
- Don't add redirects for pages that keep their URL.

## 8. Checks (must pass before you push your last commit)

- `npm run check`, `npm run lint`, `npm test`, `npm run build`, `git diff --check`.
- Copy test: every string in `src/data` page files appears in the built HTML.
- **Copy-parity test:** for each indexed page, the visible text of the built page contains every
  sentence of `source/pages/<slug>/text.txt`'s main content (ignore old header/footer chrome
  and cookie/Thrive widget text; document what you excluded). Report any intentional
  differences.
- Route tests: registry, sitemap, llms.txt, internal links and `vercel.json` agree. Every
  internal link resolves to a registry page.
- Every page: one H1, unique title + description (as live), valid JSON-LD, thank-you pages
  `noindex`.
- Phone test: the only phone number in `dist` is the NAP.
- Forms unit tests: body shape per form (incl. `event` and repeater flattening), host gate
  (localhost/preview never post to production), retry keeps the id, success/failure UX,
  conversion fires once, thank-you navigation only on confirmed success.
- Playwright at 1440 and 390: no horizontal scroll, header hides/returns, hamburger works with
  the same links, mobile bottom bar phones only, map makes no request on load.
- **Visual check:** Playwright screenshots of each built page at 1440 and 390 saved to
  `docs/qa/screens/<slug>-{desktop,mobile}.jpg` (JPEG, ≤ 1200 px wide) so Claude can compare
  against `source/pages/<slug>/*.jpg`.
- Lighthouse mobile locally on home, a program page, a form page and contact: report scores.
  Target 95+ / 100 / 100 / 100. First-frame check `--controls` then `RUNS=5` on the local
  preview; report results.

## 9. Not in this job

- No Central Forms registration, SQL or env changes (Claude does that with Josh).
- No Mailchimp code.
- No Vercel project creation, DNS or domain changes.
- No merge, no PR (Claude opens and drives the PR).

## 10. Report

At the end, write `docs/qa/build-report.md`: what was built, every check with its result, any
copy or layout differences from the live site and why, images left out, open questions for
Josh.
