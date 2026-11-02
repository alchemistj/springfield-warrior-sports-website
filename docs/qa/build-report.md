# Springfield Warrior Sports Astro rebuild

Static Astro site for the single Springfield location. Live URLs are unchanged. Copy comes from `source/pages/<slug>/text.txt`. Built on `cursor/astro-rebuild`. No pull request and no merge.

## What was built

- 23 routes from the captured WordPress site. `/` is the homepage. Thank-you routes stay noindex and out of the sitemap and `llms.txt`.
- Header links in the live order, plus a mobile hamburger with the same links and hide-on-scroll.
- Sticky mobile bar: Call `tel:+14178947319`, and Book a Party to `/schedule-birthday-party/`. On that page the second button is `#party-form`.
- Trust bar under every hero: Springfield Warrior Sports, Ninja and Parkour Gym, Kids, Adults, Summer Camps, and the click-to-call phone. Those words already exist on the live site. The bar itself is new.
- Central Forms component for birthday-party, camp-registration, competition-registration (CSNA and WNL), personal-training, event-waitlist (Nerf and Laser), and main-contact. Production posts only from `www.springfieldwarriorsports.com` to `https://forms.fluidframemarketing.com/api/lead`. Preview uses `/api/preview-forms-lead/` and 404s in production.
- 103 redirects in `vercel.json`: the 29 legacy rules, both slash forms, one hop, trailing-slash destinations, no-slash to slash for canonical pages, and apex `springfieldwarriorsports.com` to `https://www.springfieldwarriorsports.com/:path*`. HTTP to HTTPS is left to Vercel.
- JSON-LD is SportsActivityLocation, LocalBusiness, and BreadcrumbList. No ratings. No geo coordinates. Sunday is a note, not an opening-hours range. No FAQPage, because no FAQ block was captured.

## Checks

| Check | Result |
|---|---|
| `npm run check` (`astro check`) | Pass, 0 errors |
| `npm run lint` | Pass |
| Unit tests (`vitest run`) | Pass, 17 tests |
| `npm run build` | Pass, 23 pages |
| `git diff --check` | Pass |
| Playwright 1440 and 390 | Pass. No horizontal scroll, header hides and returns, hamburger links match, call bar is hidden at 1440 and phones only at 390, party page jumps to `#party-form`, contact load recorded no Google Maps or gtag request |
| Screenshots | 46 JPEGs in `docs/qa/screens/`, each at most 1200px wide |
| Copy parity | Pass. Every sentence of each page's main text is in the built visible text |
| Phone | Pass. The only phone digits in `dist/` are 4178947319 |
| First-frame controls | Fail on this machine. See below |
| First-frame site, `RUNS=5` | Pass, 40/40, worst MAE 0 |
| Lighthouse mobile, local preview | Home 100/100/100/100. Kids classes 97/100/100/100. Birthday form 99/100/100/100. Contact 99/100/100/100. Order is performance / accessibility / best practices / SEO |

Playwright used Chrome `chromium-1248` with `LD_LIBRARY_PATH` pointed at `/home/fluidframe/.local/pw-libs`, because the system image does not have `libatk`.

First-frame `--controls` did not pass. The synthetic good page flickered on some runs (MAE about 30–40), and the header-first page sometimes recorded a single frame and passed. Delayed, swap, and blank pages failed as expected. The site check still passed: home, `/kids-classes/`, `/schedule-birthday-party/`, and `/contact/`, mobile and desktop, five runs each, worst MAE 0. A few runs recorded only one contentful frame. Home mobile recorded 4–6 frames at MAE 0. That run was on the build just before the button-red adjustment below. The adjustment changes button fill only, so the first and settled frames still match each other.

## Copy and layout differences

- Trust bar, hamburger, hide-on-scroll header, and mobile call bar are additions the spec requires. They are not on the live header.
- Button and call-bar red is `#d6352f`. The live red `#db3a34` measured 4.49:1 with white bold 14px text. `#d6352f` clears 4.5:1. Lighthouse accessibility went from 96 to 100 after this change. Blue `#3569b4` and blue-dark `#285276` are unchanged.
- Pages whose live meta H1 was empty use one H1 from the first all-caps heading or the page title: schedule-birthday-party is "CLIENT TESTIMONIALS"; homeschool is "HOMESCHOOL KIDS SPORTS"; the six thank-you pages use their titles. Live H1s that were split across lines are one H1.
- Thank-you pages had empty meta descriptions. Each description is the page's first line, such as "WE RECEIVED THOSE DETAILS, THANK YOU!".
- Gravity Forms choice HTML is flattened to the visible label text. The first textarea is the top-level message. Other answers are `customFields`, including `customFields.event`.
- GF18 (summer fun) is not embedded on a captured page, so it has no form on the site. The summer-fun thank-you page and its Square link remain.
- Legacy in-page links that pointed at a redirected URL now point at the final URL. `/school-day-off-solutions/` goes to `/summer-camps-in-springfield-mo/`.
- Footer address stays "605 W Farm Rd 182, Springfield, MO, 65810, United States". Contact and schema stay "605 W. Plainview Road, Springfield, MO 65810".
- The logo is an inline palette PNG, 2,670 bytes. There was no SVG.
- Heroes are inline AVIF, not enlarged past the captured file. Home source is 324×302 (about 3 KB). About is 492×285 (about 1.1 KB). Several banners are wide and short, so a 1280×35–60 KB hero was not possible without inventing pixels. Competitions is about 40 KB. Contact is about 20 KB.
- Fonts are self-hosted Heebo 400/700 and Epilogue 700/800 with `font-display: optional`.
- No privacy or terms pages. None of the captured forms has an SMS consent checkbox.
- Three hotlinked images were not copied. They are listed in `source/media/skipped.txt`:
  - `https://cdn.prod.website-files.com/6254371b79a689fbdc2b6866/62544e735ced2e7233a47d90_About%20Us%20in%20Springfield%20Hero.jpg`
  - `https://10fitness.com/wp-content/uploads/2024/10/springfield-1.jpg`
  - `https://mbrportal.genesishealthclubs.com/assets/img/genesis_app_background.png`

The copy-parity test ignores the repeated header nav lines and stops at the footer tagline. It does not compare cookie-banner or Thrive widget chrome.

## Open questions

- Where GF18 should live, if it should be a page at all.
- Whether Josh has larger originals for the small heroes (home classes photo, about gym photo, pricing banner).
- Central Forms registration, the preview lead URL, Vercel project, and DNS are out of this job.
- Sunday has no clock range in the source, so it is not in schema hours.
