# Launch QA (12–13 Nov 2026)

Run on the `cursor/astro-rebuild` preview (stable alias `git-26436f`) after #9, #10 and #11, at 1920, 1280 and 390 px (Rule 17.1). Fixes landed in #11.

## Results

| Check | Result |
|---|---|
| All 23 pages × 3 widths (69 loads) | 200, no console errors, no failed requests, no broken images, no sideways scroll, every font weight loaded, one H1 and a meta description per page |
| Content parity (layout map vs `docs/qa/layout-map/live`) | No missing content. Expected items only: footer logo now white on the dark Rule 4.4 footer (live: black logo), "QUICK LINKS" replaced by the Rule 4.4 columns, Gravity Forms' "* indicates required fields", the home card box (Rule 4.1), and one lazy image live had not loaded (best-gyms at 390) |
| Paragraph check (`scripts/qa/paragraphs.mjs`) | 0 issues |
| Footer (Rule 4.4) | 4 equal columns (210px at 1440) with headings, labelled tel and mailto, address, hours, service area, copyright; no `#` or old-site links |
| Trust bar (Rule 9) | Facts checked against `source/` (#9) |
| Old URLs | 23 pages (both slash forms), 29 legacy redirects (both forms), WordPress feeds, `/category/…`, `/home/` and the Yoast/WP sitemaps all 200 or 301. `/wp-admin/` family returns 403 (fine). `/Birthday-Parties/` (capitals) is 404: WordPress matched any case, Vercel does not |
| Pay and outside links | Every Square link opens a live product or checkout; waiver opens. The Summer Fun 2024 product says "event has ended" (same as live). Thrivent advisor link was dead and is unlinked |
| Forms | All 8 submitted from the preview and delivered to support@ (BCC Josh). CSNA and WNL now carry the registrant's email (#11) |
| Mobile Lighthouse (home, birthday parties, kids classes, fitness, camps, contact) | Performance 94–100; Best Practices 100; Accessibility 91–96; SEO 69 on preview only because of the preview `noindex` header |
| Deployment Protection | Off (no password or SSO) |

## Open items

- ~~Journey tracking (Rule 14.1) is not built.~~ Built in #13 and verified on the preview on 13 Nov. Cookies are set on pages only, with a bot marker; events carry the IDs; a real support@ lead's attribution matched the cookies; no env vars needed; home mobile performance 100. Remaining: FF Reports registration (ff-reports-analytics #218).
- Registration forms are open for past dates (CSNA 19 Sep 2026, WNL 26 Oct 2024, 2026 Summer Camp), as on live. The `open` flag in `events.json` is not wired to anything yet.
- Accessibility contrast: brand red `#db3a34` on white is 4.49:1 (needs 4.5), live link blue `#2f8ae4` is 3.57:1, reviewer names `#d6352f` on `#e5eaed` are 3.92:1. Live's colours, kept.
- `astro check` reports 7 type errors that predate launch QA (HomeBody, LeadForm line 21, PersonalBody). The build and tests pass.
- Central Forms: 1 of 8 test leads came back 503 `delivery_reconciliation_required` with `saved:true`; the email went out 15 s later. The site now treats `saved:true` as received (#11, Central Forms SA-5).

## DNS day

The runbook is in PR #1's description.
