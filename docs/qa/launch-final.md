# Final launch QA (weekend, 13 Nov 2026)

Run on the `cursor/astro-rebuild` preview (`git-26436f`), the branch PR #1 merges to `main`, at 1440 and 390 px.

| Check | Result |
|---|---|
| 23 pages × 2 widths (46 loads) | All 200. No console errors, no failed requests, no broken images, no sideways scroll |
| Overlap scan (visible text, buttons and images whose boxes intersect, excluding the fixed header and sticky bar) | One real defect: the summer camp dates (fixed in #15). The other hits are inline spans and links wrapping across lines (footer hours, the birthday "clicking here" sentence, kids note, fitness, personal training), the hero H1 and H2 at their designed tight leading, and the team hero photo meeting the title band. All checked in screenshots |
| Forms | All 8 submitted to `support+swstest@fluidframemarketing.com` (200) and reached their thank-you page or message |
| Journey tracking | Page views and the engaged follow-up carry the cookie `ff_sid`/`ff_vid`. `lead_form_success` fired on a real support@ lead, whose attribution matched the cookies |
| Old WordPress URLs (118) | 26 return 200, 86 return 301, and every redirect lands on a 200 page. `/wp-admin/` family returns 403 (blocked, fine). `/Birthday-Parties/` (capitals) is 404; no fix, because a lowercase rule would clash with the capitalised Google Business Profile entry paths Rule 14.1 reserves |
| Paragraph check | 0 issues |

## Fixed in #15

- **Summer camp dates (`/summer-camps-in-springfield-mo/`).**
  - **Below 1100px:** the live-copied layout pinned the times at a fixed 202px offset. "August 17th - August 21st" ran into "8:30 AM", and every time broke as "11:30 / AM". Each row now stacks the date over its times, each on one line.
  - **Desktop:** dates wrapped mid-phrase ("June 22nd - June / 26th"). They now sit in a 240px column with the times aligned.
  - Checked at 1440, 1100, 1024 and 390: no wrapping and no overflow.
