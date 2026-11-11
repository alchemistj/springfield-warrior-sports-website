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
- Heroes are inline AVIF. The home hero is the live gym photo (`IMG_2341`), encoded at 960px. Other heroes use the captured banner for that page and are not swapped for a different photo.
- Fonts in the Review 1 rebuild are self-hosted Muli 400/700, Heebo 800/900, and Epilogue 300/500, with `font-display: optional`. The earlier Heebo 400/700 and Epilogue 700/800 files are unused.
- No privacy or terms pages. None of the captured forms has an SMS consent checkbox.
- Three hotlinked images were not copied. They are listed in `source/media/skipped.txt`:
  - `https://cdn.prod.website-files.com/6254371b79a689fbdc2b6866/62544e735ced2e7233a47d90_About%20Us%20in%20Springfield%20Hero.jpg`
  - `https://10fitness.com/wp-content/uploads/2024/10/springfield-1.jpg`
  - `https://mbrportal.genesishealthclubs.com/assets/img/genesis_app_background.png`

The copy-parity test ignores the repeated header nav lines and stops at the footer tagline. It does not compare cookie-banner or Thrive widget chrome.

## Review 1 fixes

Side-by-side images are in `docs/qa/review-2/`. Live capture is on the left. This build is on the right. Each half is 708px wide.

| Page | Section | What changed | Remaining difference |
|---|---|---|---|
| Every page | Header | Black utility bar (Contact, About, Sign Our Waiver) over the blue `#285276` bar. White logo on the left. Main nav on one line. Mobile keeps the hamburger. Hide-on-scroll stays. | The hide-on-scroll header and the hamburger are spec additions. |
| Every page | Fonts | Body is self-hosted Muli (Mulish). Headings are Heebo 800/900. Thin second lines are Epilogue 300. `font-display: optional`. No font preload. | Live loads these from Google. The files here are the latin subsets. |
| Every page | Footer | White footer, black logo, the live tagline, round red Facebook and Instagram icons, icon contact column, Quick Links, black copyright bar. | Footer address stays Farm Rd 182. Contact stays W. Plainview Road. |
| Every page | Trust bar | Spec addition under the hero. | On home the program words stay in the live bullet bar, so the trust bar is only the name, tagline, and phone. Other pages include Kids, Adults, and Summer Camps in the trust bar. |
| Home | Hero | Dark gym photo `IMG_2341` (the live CSS background). It was not in the media capture, so it is stored locally. Red "STRONGER", white thin kicker, subhead inside the hero. | The inline AVIF is a 960px crop at quality 28, about 19 KB, so the phone score stays at the target. |
| Home | Bullet bar | Black bar, red dots, Kids, Adults, Summer Camps, Community, Birthday Parties. | None beyond the trust bar noted above. |
| Home | Get ready | Two-part red and thin headings. The captured side-by-side gym photo. Clock icon list for Open Gym Hours. | The two photos are the one captured composite, not two separate files. |
| Home | Blue band | Full-width blue band, centered white title, white cards with photo, title, text, and red button. Birthday Parties and Personal Training are their own cards. | Card photos are the captured set, in live order. |
| Home | Everyday warrior | Thin "BE AN" over red "EVERYDAY WARRIOR!", copy, button, photo on the right. | None. |
| Home | Testimonials | Centered red title, thin dark subtitle, two columns, quote icon, red name. | Quote names use `#b4231e` (6.01:1 on the grey band). `#d6352f` was 4.36:1 there. The scraped quote-icon and footer-logo files are not repeated in the logo row. |
| Kids classes | Sections | Alternating class photos, red and thin headings, class-time subheads, black fun band, photo grid, three camp cards. | Class-time subheads use `#b4231e` so "CLASS TIMES" clears 4.5:1 on the grey band. The birthday-parties card photo was not in the capture. The day-camp card uses the captured Day Camps photo. |
| Contact | Page | One "CONTACT US" heading, icon list, stacked name fields in the white card, both gym photos, centered hero text. | "Map of the gym" and "Show map" are the deferred map from the spec. The map does not load Google on first paint. |
| Schedule a party | Page | No hero text. Numbered steps. Grey form with live placeholders, First/Last sub-labels, and the red submit. | First/Last sub-labels use `#595959`. `#777` failed contrast on the white fields. The page H1 is "CLIENT TESTIMONIALS" on the testimonials heading, because the live meta H1 was empty. |
| Competitions | Details and form | Centered white hero. Date, time, and price as an icon list. Participant bar first, then Home Gym, email, and phone. "Don't wait" prints once. | The live details photo strip was not in the capture, so that column is empty. |
| Form pages | Dumped labels | Gravity Forms field dumps are not printed outside the form. | The copy-parity test now treats those lines as form chrome, so dumping them can no longer satisfy the test. |
| Buttons | Color | Red stays `#d6352f` so white bold 14px text clears 4.5:1. | Live red `#db3a34` measured 4.49:1. |
| Phone layout | Below the fold | Sections below the header use `content-visibility: auto` with a 5200px intrinsic size, taller than the tallest section, so skipped sections do not overlap the footer. | This is a paint skip for the phone viewport. Desktop layout is unchanged. Full-page screenshots turn the skip off so every section is in the image. |

Lighthouse mobile on the local preview, after that paint skip. Order is performance / accessibility / best practices / SEO.

| Page | Score | TBT |
|---|---|---|
| Home | 98 / 100 / 100 / 100 | 88 ms |
| Kids classes | 100 / 100 / 100 / 100 | 0 ms |
| Schedule a birthday party | 100 / 100 / 100 / 100 | 57 ms |
| Contact | 100 / 100 / 100 / 100 | 79 ms |

First-frame check on this same preview: home, kids classes, schedule a birthday party, and contact, mobile and desktop, three runs each, 24/24, worst MAE 0.

## Review 2 fixes

Side-by-side images are in `docs/qa/review-3/`. Live capture is on the left. This build is on the right. Each half is 708px wide. Each page was scrolled to the bottom before the screenshot so lazy images loaded. Sizes below are the desktop rules in `source/pages/*/rendered.html`, at a 1440px-wide window.

| Page | Section | What changed | Remaining difference |
|---|---|---|---|
| Home | Hero | Height is `calc(80vh + 40px)` (760px when the window is 900px tall). "STRONGER" is Heebo 900 at 70px. "ONE OBSTACLE AT A TIME!" is Heebo 400 at 45px. The subhead is Epilogue 20px. The scrim is `linear-gradient(270deg, rgba(0,0,0,.4) 0, rgba(0,0,0,.85) 61%)`. Mobile is 466px tall, with the H1 at 45px and the kicker at 25px. | The review note said about 520px. The captured rule is 80vh plus 40px of section padding, and the live screenshot measures about 760px. The trust bar under the bullet bar is still the spec addition. |
| Other heroes | Height and H1 | Desktop height is 590px where the capture uses a 550px inner min-height plus 40px of padding. Best Gyms, Personal Training, and Meet the Team are 490px. Laser Tag is 540px. H1 is 70px on the large heroes, 60px on birthday parties, and 50px on the rest. Mobile uses the captured min-heights and sizes (45px, 32px, or 26px). | Thank-you and registered pages stay at the previous 520px banner. Live puts the team photo beside the text, not in a banner. No new words were added. |
| Home | Blue cards | The photo column is 32.6% of the card and the image covers its full height. Parkour uses `object-position: 15% 100%` so the vault over the green box is in frame. Homeschool is `15% 87%`. Personal Training is `20% 87%`. The files are the live card backgrounds, in order. On a phone the photo sits above the text at the full card width. | None in the photo crop. Card copy is the same words. |
| Desktop | Type | Red section headings are Heebo 900 at 50px. The thin second line is Heebo 400 at 30px with 1px letter-spacing. Body paragraphs are Epilogue 300 at 16px, line-height 1.6. Card titles are 30px. "Open Gym Hours" is 30px. | The lightest self-hosted Heebo file is 400. Live thin lines are Heebo 300. |
| Forms | Spacing | Birthday and the other panel forms use Epilogue 18px labels, 16px fields, 25px 14px padding, a 15px grid gap, and 50px selects. Contact fields use 18px 14px padding, 14px Arial, and 10px of vertical margin. Mobile contact padding is 14px 12px. | Field backgrounds are the captured `#f1f1f1` and `#f8f8f8`. Submit buttons stay `#d6352f`. |

Lighthouse mobile on the local preview, after these fixes. Order is performance / accessibility / best practices / SEO.

| Page | Score | TBT |
|---|---|---|
| Home | 98 / 100 / 100 / 100 | 0 ms |
| Kids classes | 99 / 100 / 100 / 100 | 0 ms |
| Schedule a birthday party | 100 / 100 / 100 / 100 | 0 ms |
| Contact | 99 / 100 / 100 / 100 | 0 ms |

## Layout parity batch 1

Model: Grok 4.7. Gate: `scripts/qa/compare-layout.mjs` against `docs/qa/layout-map/live` with `scripts/qa/layout-allow.json`. Tolerances and the live map were not edited. No new allow entries. The report is `docs/qa/layout-report.md`.

Shared content column is 1150px, centered (`--gutter: 20px`). Self-hosted faces: Epilogue 300/400/500/600/800, Heebo 300/400/600/800/900, Muli 400/700/800, all `font-display: swap`. Home, about, and kids-classes use the live column, the live heading and body weights and colors, and a two-up CSS scroll-snap testimonial track.

Differences per page, before (baseline) and after, at 1920 / 1280 / 390, then the three-width total.

| Page | Before 1920 | 1280 | 390 | Total | After 1920 | 1280 | 390 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| about | 64 | 64 | 45 | 173 | 0 | 0 | 0 | 0 |
| best-gyms-in-springfield | 129 | 128 | 90 | 347 | 126 | 126 | 89 | 341 |
| birthday-parties | 69 | 69 | 40 | 178 | 66 | 66 | 38 | 170 |
| competitions | 20 | 20 | 12 | 52 | 18 | 18 | 10 | 46 |
| contact | 18 | 16 | 21 | 55 | 13 | 13 | 18 | 44 |
| fitness-classes | 98 | 98 | 40 | 236 | 93 | 93 | 36 | 222 |
| home | 86 | 85 | 65 | 236 | 0 | 0 | 0 | 0 |
| homeschool-sports-and-classes-springfield-mo | 40 | 40 | 32 | 112 | 38 | 38 | 30 | 106 |
| kids-classes | 131 | 131 | 85 | 347 | 0 | 0 | 0 | 0 |
| laser-tag | 53 | 53 | 42 | 148 | 50 | 50 | 38 | 138 |
| meet-the-team | 250 | 250 | 127 | 627 | 247 | 247 | 125 | 619 |
| nerf-wars | 46 | 46 | 34 | 126 | 45 | 45 | 31 | 121 |
| parkour | 77 | 77 | 49 | 203 | 73 | 73 | 46 | 192 |
| personal-training | 167 | 166 | 69 | 402 | 164 | 164 | 66 | 394 |
| registered | 3 | 3 | 6 | 12 | 2 | 2 | 4 | 8 |
| registered-for-csna-competition | 5 | 5 | 5 | 15 | 4 | 4 | 4 | 12 |
| registered-for-day-camps | 9 | 9 | 12 | 30 | 8 | 8 | 10 | 26 |
| registered-for-summer-fun-competition | 4 | 4 | 7 | 15 | 3 | 3 | 5 | 11 |
| registered-for-wnl-competition | 3 | 3 | 6 | 12 | 2 | 2 | 4 | 8 |
| schedule-birthday-party | 14 | 14 | 10 | 38 | 12 | 12 | 8 | 32 |
| summer-camps-in-springfield-mo | 91 | 91 | 65 | 247 | 87 | 87 | 61 | 235 |
| thank-you-for-your-feedback | 3 | 3 | 6 | 12 | 2 | 2 | 4 | 8 |
| wnl-competitions | 26 | 26 | 18 | 70 | 24 | 24 | 16 | 64 |
| All pages | | | | 3693 | | | | 2797 |

Home, about, and kids-classes are 0 at all three widths. No other page's count went up.

Lighthouse mobile on the local preview, after this batch. Order is performance / accessibility / best practices / SEO.

| Page | Score |
|---|---|
| Home | 98 / 100 / 100 / 100 |
| About | 100 / 100 / 100 / 100 |
| Kids classes | 100 / 100 / 100 / 100 |

## Layout parity gate v2

Model: Grok 4.7. Same compare command as batch 1, against the recaptured live map, with `scripts/qa/layout-allow.json`. The live map, the scripts, the tolerances, and `PIXEL_TOL` were not edited. The report is `docs/qa/layout-report.md`.

Before is `docs/qa/layout-report-gate-v2.md` (8,239). After is 3,944. Home, about, and kids-classes are 0 at 1920, 1280, and 390. No other page's count went up.

| Page | Before 1920 | 1280 | 390 | Total | After 1920 | 1280 | 390 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| about | 76 | 76 | 51 | 203 | 0 | 0 | 0 | 0 |
| best-gyms-in-springfield | 266 | 267 | 151 | 684 | 201 | 202 | 114 | 517 |
| birthday-parties | 156 | 156 | 87 | 399 | 92 | 92 | 51 | 235 |
| competitions | 90 | 90 | 58 | 238 | 22 | 22 | 15 | 59 |
| contact | 99 | 103 | 67 | 269 | 36 | 36 | 29 | 101 |
| fitness-classes | 192 | 192 | 100 | 484 | 128 | 128 | 64 | 320 |
| home | 125 | 125 | 96 | 346 | 0 | 0 | 0 | 0 |
| homeschool-sports-and-classes-springfield-mo | 124 | 124 | 89 | 337 | 59 | 59 | 53 | 171 |
| kids-classes | 120 | 120 | 83 | 323 | 0 | 0 | 0 | 0 |
| laser-tag | 142 | 142 | 97 | 381 | 78 | 78 | 62 | 218 |
| meet-the-team | 339 | 339 | 177 | 855 | 274 | 274 | 139 | 687 |
| nerf-wars | 135 | 135 | 85 | 355 | 71 | 71 | 48 | 190 |
| parkour | 153 | 153 | 94 | 400 | 86 | 86 | 52 | 224 |
| personal-training | 267 | 267 | 120 | 654 | 203 | 203 | 77 | 483 |
| registered | 72 | 72 | 48 | 192 | 5 | 5 | 7 | 17 |
| registered-for-csna-competition | 72 | 72 | 47 | 191 | 6 | 6 | 6 | 18 |
| registered-for-day-camps | 74 | 74 | 51 | 199 | 7 | 7 | 9 | 23 |
| registered-for-summer-fun-competition | 72 | 72 | 49 | 193 | 5 | 5 | 7 | 17 |
| registered-for-wnl-competition | 72 | 72 | 48 | 192 | 5 | 5 | 7 | 17 |
| schedule-birthday-party | 90 | 90 | 57 | 237 | 23 | 23 | 15 | 61 |
| summer-camps-in-springfield-mo | 229 | 229 | 171 | 629 | 162 | 162 | 128 | 452 |
| thank-you-for-your-feedback | 74 | 74 | 50 | 198 | 7 | 7 | 9 | 23 |
| wnl-competitions | 105 | 105 | 70 | 280 | 40 | 40 | 31 | 111 |
| All pages | | | | 8239 | | | | 3944 |

Header and footer are measured on every page. Menu and utility links are Heebo 600 at the live sizes. The content column stays 1150px. The footer column is 1110px. Home "Be an Everyday Warrior" is a full-width background with the photo on the right. Testimonials show two at a time. Open Gym Hours uses the red heading and red clocks. "The best part?" is navy at weight 500. Parkour, Personal Training, and Best Gyms use the live crops.

Allow entries are the trust bar, the Call and Book a Party buttons, Josh's Plainview Road wording, and the live United States address line this footer does not show. The Memorial Day sentence is visible, in the same paragraph as the Community Murph sentence.

Lighthouse mobile on the local preview, after this batch. Order is performance / accessibility / best practices / SEO.

| Page | Score |
|---|---|
| Home | 98 / 100 / 100 / 100 |
| About | 98 / 100 / 100 / 100 |
| Kids classes | 99 / 100 / 100 / 100 |

## Layout parity gate v2.2

Model: Grok 4.7. Same compare command, against the recaptured v2.2 live map, with `scripts/qa/layout-allow.json`. The live map, the scripts, the tolerances, and `PIXEL_TOL` were not edited. The report is `docs/qa/layout-report.md`.

Before is the v2.2 baseline in `docs/qa/layout-report-gate-v2.md` (4,314). After is 3,905. Home, about, and kids-classes are 0 at 1920, 1280, and 390. No other page's count went up. No allow entries were added.

| Page | Before 1920 | 1280 | 390 | Total | After 1920 | 1280 | 390 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| about | 20 | 20 | 14 | 54 | 0 | 0 | 0 | 0 |
| best-gyms-in-springfield | 189 | 190 | 108 | 487 | 182 | 183 | 106 | 471 |
| birthday-parties | 98 | 98 | 49 | 245 | 92 | 92 | 47 | 231 |
| competitions | 30 | 30 | 17 | 77 | 23 | 23 | 15 | 61 |
| contact | 40 | 40 | 30 | 110 | 34 | 34 | 28 | 96 |
| fitness-classes | 135 | 135 | 67 | 337 | 129 | 129 | 65 | 323 |
| home | 16 | 16 | 13 | 45 | 0 | 0 | 0 | 0 |
| homeschool-sports-and-classes-springfield-mo | 61 | 61 | 51 | 173 | 55 | 55 | 49 | 159 |
| kids-classes | 9 | 9 | 8 | 26 | 0 | 0 | 0 | 0 |
| laser-tag | 88 | 88 | 69 | 245 | 82 | 82 | 67 | 231 |
| meet-the-team | 290 | 290 | 140 | 720 | 284 | 284 | 138 | 706 |
| nerf-wars | 77 | 77 | 52 | 206 | 71 | 71 | 50 | 192 |
| parkour | 107 | 106 | 54 | 267 | 101 | 100 | 52 | 253 |
| personal-training | 208 | 208 | 78 | 494 | 202 | 202 | 76 | 480 |
| registered | 9 | 9 | 7 | 25 | 3 | 3 | 5 | 11 |
| registered-for-csna-competition | 10 | 10 | 6 | 26 | 4 | 4 | 4 | 12 |
| registered-for-day-camps | 12 | 12 | 10 | 34 | 6 | 6 | 8 | 20 |
| registered-for-summer-fun-competition | 10 | 10 | 8 | 28 | 4 | 4 | 6 | 14 |
| registered-for-wnl-competition | 9 | 9 | 7 | 25 | 3 | 3 | 5 | 11 |
| schedule-birthday-party | 27 | 27 | 15 | 69 | 21 | 21 | 13 | 55 |
| summer-camps-in-springfield-mo | 172 | 172 | 133 | 477 | 166 | 166 | 131 | 463 |
| thank-you-for-your-feedback | 9 | 9 | 7 | 25 | 3 | 3 | 5 | 11 |
| wnl-competitions | 44 | 44 | 31 | 119 | 38 | 38 | 29 | 105 |
| All pages | | | | 4314 | | | | 3905 |

The shared black utility bar is 46px on desktop so the Contact, About, and Sign Our Waiver links sit on black. Footer CONTACT, QUICK LINKS, and the desktop copyright line are letter-spacing 2px. The home bullet bar is letter-spacing 0, justified to 827px. The mobile home kicker is letter-spacing 7px. Testimonials, the about colors section, and the kids summer-camps heading use the live band `#e5eaed` (rgb(229, 234, 237) from the rendered HTML). Section gaps on about and kids-classes follow the live heading spacing. The Memorial Day sentence is visible in the Community Murph paragraph.

Lighthouse mobile on the local preview, after this batch. Order is performance / accessibility / best practices / SEO.

| Page | Score |
|---|---|
| Home | 98 / 100 / 100 / 100 |
| About | 98 / 100 / 100 / 100 |
| Kids classes | 99 / 100 / 100 / 100 |

## Layout parity gate v2.3

Model: Grok 4.7. Same compare command, against the recaptured v2.3 live map, with `scripts/qa/layout-allow.json`. The live map, the scripts, the tolerances, and `PIXEL_TOL` were not edited. The report is `docs/qa/layout-report.md`.

Before is the v2.3 baseline in `docs/qa/layout-report-gate-v2.md` (4,097). After is 4,059. Home and kids-classes are 0 at 1920, 1280, and 390. About is 1 at each width, and that line is the checker's JPEG-versus-PNG dominant color on the hero title, described in the layout report. No other page's count went up. No allow entries were added.

| Page | Before 1920 | 1280 | 390 | Total | After 1920 | 1280 | 390 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| about | 4 | 4 | 4 | 12 | 1 | 1 | 1 | 3 |
| best-gyms-in-springfield | 186 | 186 | 107 | 479 | 185 | 185 | 107 | 477 |
| birthday-parties | 100 | 100 | 49 | 249 | 100 | 100 | 49 | 249 |
| competitions | 25 | 25 | 15 | 65 | 24 | 24 | 15 | 63 |
| contact | 35 | 35 | 33 | 103 | 35 | 35 | 33 | 103 |
| fitness-classes | 135 | 135 | 71 | 341 | 135 | 135 | 71 | 341 |
| home | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| homeschool-sports-and-classes-springfield-mo | 61 | 61 | 55 | 177 | 61 | 61 | 55 | 177 |
| kids-classes | 8 | 8 | 9 | 25 | 0 | 0 | 0 | 0 |
| laser-tag | 88 | 88 | 74 | 250 | 88 | 88 | 74 | 250 |
| meet-the-team | 286 | 286 | 141 | 713 | 286 | 286 | 141 | 713 |
| nerf-wars | 77 | 76 | 56 | 209 | 77 | 76 | 56 | 209 |
| parkour | 110 | 109 | 53 | 272 | 110 | 109 | 53 | 272 |
| personal-training | 200 | 200 | 74 | 474 | 200 | 200 | 74 | 474 |
| registered-for-csna-competition | 4 | 4 | 4 | 12 | 4 | 4 | 4 | 12 |
| registered-for-day-camps | 7 | 7 | 8 | 22 | 7 | 7 | 8 | 22 |
| registered-for-summer-fun-competition | 5 | 5 | 6 | 16 | 5 | 5 | 6 | 16 |
| registered-for-wnl-competition | 4 | 4 | 5 | 13 | 4 | 4 | 5 | 13 |
| registered | 4 | 4 | 5 | 13 | 4 | 4 | 5 | 13 |
| schedule-birthday-party | 22 | 22 | 11 | 55 | 22 | 22 | 11 | 55 |
| summer-camps-in-springfield-mo | 173 | 171 | 130 | 474 | 173 | 171 | 130 | 474 |
| thank-you-for-your-feedback | 4 | 4 | 5 | 13 | 4 | 4 | 5 | 13 |
| wnl-competitions | 40 | 40 | 30 | 110 | 40 | 40 | 30 | 110 |
| All pages | | | | 4097 | | | | 4059 |

The about "Curious about the colors of our gym?" band and the kids summer-camps heading plus its three cards are full-width `#e5eaed` (rgb(229, 234, 237)). The about hero is a 50% black overlay on the crowd photo, so the photo stays visible behind the red title. The kids hero has no darkening overlay. The desktop kids kicker sits on the same line as live. The Memorial Day sentence is visible in the Community Murph paragraph.

Lighthouse mobile on the local preview, after this batch. Order is performance / accessibility / best practices / SEO.

| Page | Score |
|---|---|
| Home | 98 / 100 / 100 / 100 |
| About | 98 / 100 / 100 / 100 |
| Kids classes | 99 / 100 / 100 / 100 |

## Layout parity gate v2.5

Model: Grok 4.7. Same compare command, against the recaptured v2.5 live map, with `scripts/qa/layout-allow.json`. The live map, the scripts, the tolerances, and `PIXEL_TOL` were not edited. The report is `docs/qa/layout-report.md`.

Before is this machine's measurement of `5748de8` (9,087). After is 7,471. Home, about, and kids-classes are 0 at 1920, 1280, and 390. No other page's count went up. No allow entries were added. The dispatch listed home 51/52/56, about 65/64/56, and kids-classes 182/182/174 on that same commit. This machine measured 50/51/56, 63/62/57, and 182/182/173. After is 0/0/0 either way.

| Page | Before 1920 | 1280 | 390 | Total | After 1920 | 1280 | 390 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| about | 63 | 62 | 57 | 182 | 0 | 0 | 0 | 0 |
| best-gyms-in-springfield | 371 | 372 | 188 | 931 | 358 | 359 | 177 | 894 |
| birthday-parties | 214 | 215 | 84 | 513 | 201 | 202 | 73 | 476 |
| competitions | 68 | 68 | 52 | 188 | 55 | 55 | 41 | 151 |
| contact | 86 | 86 | 48 | 220 | 73 | 73 | 37 | 183 |
| fitness-classes | 253 | 252 | 128 | 633 | 240 | 239 | 117 | 596 |
| home | 50 | 51 | 56 | 157 | 0 | 0 | 0 | 0 |
| homeschool-sports-and-classes-springfield-mo | 115 | 115 | 105 | 335 | 102 | 102 | 94 | 298 |
| kids-classes | 182 | 182 | 173 | 537 | 0 | 0 | 0 | 0 |
| laser-tag | 182 | 184 | 150 | 516 | 169 | 171 | 139 | 479 |
| meet-the-team | 560 | 560 | 195 | 1315 | 547 | 547 | 184 | 1278 |
| nerf-wars | 152 | 152 | 119 | 423 | 139 | 139 | 108 | 386 |
| parkour | 196 | 196 | 98 | 490 | 183 | 183 | 87 | 453 |
| personal-training | 339 | 340 | 114 | 793 | 326 | 327 | 103 | 756 |
| registered-for-csna-competition | 25 | 25 | 23 | 73 | 12 | 12 | 12 | 36 |
| registered-for-day-camps | 26 | 26 | 25 | 77 | 13 | 13 | 14 | 40 |
| registered-for-summer-fun-competition | 27 | 27 | 26 | 80 | 14 | 14 | 15 | 43 |
| registered-for-wnl-competition | 25 | 25 | 24 | 74 | 12 | 12 | 13 | 37 |
| registered | 25 | 25 | 24 | 74 | 12 | 12 | 13 | 37 |
| schedule-birthday-party | 68 | 68 | 22 | 158 | 55 | 55 | 11 | 121 |
| summer-camps-in-springfield-mo | 375 | 375 | 245 | 995 | 362 | 362 | 234 | 958 |
| thank-you-for-your-feedback | 23 | 23 | 22 | 68 | 10 | 10 | 11 | 31 |
| wnl-competitions | 89 | 89 | 77 | 255 | 76 | 76 | 66 | 218 |
| All pages | | | | 9087 | | | | 7471 |

About and kids body copy is `rgba(0, 0, 0, 0.7)` at a 28px line height. Accent links use the live color, weight, and target. Only "Note:" is navy 600. Open gym times are weight 400. The about partnership sections and the kids program sections sit on full-width `rgb(241, 245, 247)`. The home bullet strip is `#000`. The Memorial Day sentence is visible in the Community Murph paragraph.

Lighthouse mobile on the local preview, after this batch. Order is performance / accessibility / best practices / SEO.

| Page | Score |
|---|---|
| Home | 98 / 100 / 100 / 100 |
| About | 98 / 100 / 100 / 100 |
| Kids classes | 100 / 100 / 100 / 100 |

## Layout parity gate v2.6

Model: Grok 4.7. Same compare command, against the recaptured v2.6 live map, with `scripts/qa/layout-allow.json`. The live map, the scripts, the tolerances, and `PIXEL_TOL` were not edited. The report is `docs/qa/layout-report.md`.

Before is this machine's measurement of `863fb44` (8,361). The dispatch measured that commit on the Vercel preview as home 22/22/39, about 17/17/41, and kids-classes 14/14/79. This machine measured home 24/24/38, about 19/19/40, and kids-classes 14/14/77. After is 7,704. Home and about are 0 at 1920, 1280, and 390. Kids-classes is 0/0/2. The Vercel preview of this commit measured the same three pages, including the same two kids-classes lines at 390. No other page's count went up. No allow entries were added.

| Page | Before 1920 | 1280 | 390 | Total | After 1920 | 1280 | 390 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| about | 19 | 19 | 40 | 78 | 0 | 0 | 0 | 0 |
| best-gyms-in-springfield | 368 | 369 | 203 | 940 | 365 | 366 | 189 | 920 |
| birthday-parties | 210 | 211 | 91 | 512 | 207 | 208 | 77 | 492 |
| competitions | 58 | 58 | 60 | 176 | 55 | 55 | 51 | 161 |
| contact | 77 | 77 | 53 | 207 | 74 | 74 | 44 | 192 |
| fitness-classes | 243 | 242 | 142 | 627 | 240 | 239 | 128 | 607 |
| home | 24 | 24 | 38 | 86 | 0 | 0 | 0 | 0 |
| homeschool-sports-and-classes-springfield-mo | 108 | 108 | 115 | 331 | 105 | 105 | 101 | 311 |
| kids-classes | 14 | 14 | 77 | 105 | 0 | 0 | 2 | 2 |
| laser-tag | 173 | 175 | 165 | 513 | 170 | 172 | 151 | 493 |
| meet-the-team | 584 | 584 | 202 | 1370 | 581 | 581 | 188 | 1350 |
| nerf-wars | 148 | 148 | 139 | 435 | 145 | 145 | 125 | 415 |
| parkour | 186 | 186 | 108 | 480 | 183 | 183 | 94 | 460 |
| personal-training | 327 | 328 | 127 | 782 | 324 | 325 | 113 | 762 |
| registered-for-csna-competition | 16 | 16 | 27 | 59 | 13 | 13 | 13 | 39 |
| registered-for-day-camps | 17 | 17 | 28 | 62 | 14 | 14 | 14 | 42 |
| registered-for-summer-fun-competition | 17 | 17 | 29 | 63 | 14 | 14 | 15 | 43 |
| registered-for-wnl-competition | 16 | 16 | 28 | 60 | 13 | 13 | 14 | 40 |
| registered | 16 | 16 | 28 | 60 | 13 | 13 | 14 | 40 |
| schedule-birthday-party | 58 | 58 | 27 | 143 | 55 | 55 | 13 | 123 |
| summer-camps-in-springfield-mo | 361 | 361 | 253 | 975 | 358 | 358 | 239 | 955 |
| thank-you-for-your-feedback | 14 | 14 | 25 | 53 | 11 | 11 | 11 | 33 |
| wnl-competitions | 79 | 79 | 86 | 244 | 76 | 76 | 72 | 224 |
| All pages | | | | 8361 | | | | 7704 |

Letter spacing is live's value: body 0, home card headings 0, the top bar and "WHAT OUR CLIENTS SAY" 1px. Paragraph links are `rgb(219, 58, 52)` with no underline. At 390, about and kids-classes use a 26px gutter. Section gaps on the three pages match the live map. The Memorial Day sentence is visible in the Community Murph paragraph.

The two remaining kids-classes lines at 390 are the phone screenshot painting the spec's Call / Book a Party bar over "ARE YOU LOOKING…", which sits at y=800 in an 844px viewport. Live has no bar. The heading box itself matches. The words and the bar stay visible.

Lighthouse mobile on the local preview, after this batch. Order is performance / accessibility / best practices / SEO. About and kids accessibility are 92 because the live red measures 4.49:1 on white.

| Page | Score |
|---|---|
| Home | 98 / 100 / 100 / 100 |
| About | 98 / 92 / 100 / 100 |
| Kids classes | 98 / 92 / 100 / 100 |

## Layout parity gate v2.8

Model: Grok 4.7. Same compare command, against the recaptured v2.8 live map, with `scripts/qa/layout-allow.json`. The live map, the scripts, the tolerances, and `PIXEL_TOL` were not edited. The report is `docs/qa/layout-report.md`.

Before is this machine's measurement of `a006990` (7,947). The dispatch measured that commit on the Vercel preview as home 10/10/5, about 7/7/4, and kids-classes 3/3/5. This machine measured home 10/10/4, about 7/7/4, and kids-classes 3/3/5. After is 7,913. Home is 3/3/0, about is 2/2/2, and kids-classes is 2/2/3. The Vercel preview of this commit measured the same three pages, with the same 19 lines. No other page's count went up. No allow entries were added.

| Page | Before 1920 | 1280 | 390 | Total | After 1920 | 1280 | 390 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| about | 7 | 7 | 4 | 18 | 2 | 2 | 2 | 6 |
| best-gyms-in-springfield | 367 | 368 | 192 | 927 | 367 | 368 | 192 | 927 |
| birthday-parties | 209 | 210 | 79 | 498 | 209 | 210 | 79 | 498 |
| competitions | 61 | 61 | 56 | 178 | 61 | 61 | 56 | 178 |
| contact | 77 | 77 | 47 | 201 | 77 | 77 | 47 | 201 |
| fitness-classes | 243 | 242 | 132 | 617 | 243 | 242 | 132 | 617 |
| home | 10 | 10 | 4 | 24 | 3 | 3 | 0 | 6 |
| homeschool-sports-and-classes-springfield-mo | 106 | 106 | 102 | 314 | 106 | 106 | 102 | 314 |
| kids-classes | 3 | 3 | 5 | 11 | 2 | 2 | 3 | 7 |
| laser-tag | 172 | 174 | 152 | 498 | 172 | 174 | 152 | 498 |
| meet-the-team | 584 | 584 | 193 | 1361 | 584 | 584 | 193 | 1361 |
| nerf-wars | 146 | 146 | 127 | 419 | 146 | 146 | 127 | 419 |
| parkour | 185 | 185 | 97 | 467 | 185 | 185 | 97 | 467 |
| personal-training | 326 | 327 | 116 | 769 | 326 | 327 | 116 | 769 |
| registered-for-csna-competition | 14 | 14 | 14 | 42 | 14 | 14 | 14 | 42 |
| registered-for-day-camps | 15 | 15 | 14 | 44 | 15 | 15 | 14 | 44 |
| registered-for-summer-fun-competition | 15 | 15 | 15 | 45 | 15 | 15 | 15 | 45 |
| registered-for-wnl-competition | 14 | 14 | 14 | 42 | 14 | 14 | 14 | 42 |
| registered | 14 | 14 | 14 | 42 | 14 | 14 | 14 | 42 |
| schedule-birthday-party | 57 | 57 | 14 | 128 | 57 | 57 | 14 | 128 |
| summer-camps-in-springfield-mo | 392 | 392 | 247 | 1031 | 392 | 392 | 247 | 1031 |
| thank-you-for-your-feedback | 12 | 12 | 11 | 35 | 12 | 12 | 11 | 35 |
| wnl-competitions | 80 | 80 | 76 | 236 | 80 | 80 | 76 | 236 |
| All pages | | | | 7947 | | | | 7913 |

Font sizes match live exactly. The About flag band is full-width grey past the photo. The home navy partner band is found, and the white band under it matches live. At 390 the Kids Classes heading no longer covers the trust-bar phone. The Memorial Day sentence is visible in the Community Murph paragraph. Paragraph links stay the live red, `rgb(219, 58, 52)`, with no underline.

The lines still open are wraps at live's size, width, and letter-spacing. The self-hosted font breaks one line off the live capture. Size and letter-spacing were not changed to force those wraps.

Lighthouse mobile on the local preview, after this batch. Order is performance / accessibility / best practices / SEO. About and kids accessibility stay at 92 because the live red measures 4.49:1 on white. That question is with Josh. The red stays.

| Page | Score |
|---|---|
| Home | 98 / 100 / 100 / 100 |
| About | 98 / 92 / 100 / 100 |
| Kids classes | 100 / 92 / 100 / 100 |

## Layout parity gate v2.8, round 8

Model: Grok 4.7. Same compare command, against the v2.8 live map, with `scripts/qa/layout-allow.json`. The live map, the scripts, the tolerances, and `PIXEL_TOL` were not edited. The report is `docs/qa/layout-report.md`.

Before is this machine's measurement of `e8050b0` (7,913). The dispatch measured that commit on the Vercel preview as home 0/0/0, about 0/0/1, and kids-classes 2/2/1. After is 7,907. Home is 3/3/0, about is 2/2/1, and kids-classes is 0/0/2. No other page's count went up. No allow entries were added.

| Page | Before 1920 | 1280 | 390 | Total | After 1920 | 1280 | 390 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| about | 2 | 2 | 2 | 6 | 2 | 2 | 1 | 5 |
| best-gyms-in-springfield | 367 | 368 | 192 | 927 | 367 | 368 | 192 | 927 |
| birthday-parties | 209 | 210 | 79 | 498 | 209 | 210 | 79 | 498 |
| competitions | 61 | 61 | 56 | 178 | 61 | 61 | 56 | 178 |
| contact | 77 | 77 | 47 | 201 | 77 | 77 | 47 | 201 |
| fitness-classes | 243 | 242 | 132 | 617 | 243 | 242 | 132 | 617 |
| home | 3 | 3 | 0 | 6 | 3 | 3 | 0 | 6 |
| homeschool-sports-and-classes-springfield-mo | 106 | 106 | 102 | 314 | 106 | 106 | 102 | 314 |
| kids-classes | 2 | 2 | 3 | 7 | 0 | 0 | 2 | 2 |
| laser-tag | 172 | 174 | 152 | 498 | 172 | 174 | 152 | 498 |
| meet-the-team | 584 | 584 | 193 | 1361 | 584 | 584 | 193 | 1361 |
| nerf-wars | 146 | 146 | 127 | 419 | 146 | 146 | 127 | 419 |
| parkour | 185 | 185 | 97 | 467 | 185 | 185 | 97 | 467 |
| personal-training | 326 | 327 | 116 | 769 | 326 | 327 | 116 | 769 |
| registered-for-csna-competition | 14 | 14 | 14 | 42 | 14 | 14 | 14 | 42 |
| registered-for-day-camps | 15 | 15 | 14 | 44 | 15 | 15 | 14 | 44 |
| registered-for-summer-fun-competition | 15 | 15 | 15 | 45 | 15 | 15 | 15 | 45 |
| registered-for-wnl-competition | 14 | 14 | 14 | 42 | 14 | 14 | 14 | 42 |
| registered | 14 | 14 | 14 | 42 | 14 | 14 | 14 | 42 |
| schedule-birthday-party | 57 | 57 | 14 | 128 | 57 | 57 | 14 | 128 |
| summer-camps-in-springfield-mo | 392 | 392 | 247 | 1031 | 392 | 392 | 247 | 1031 |
| thank-you-for-your-feedback | 12 | 12 | 11 | 35 | 12 | 12 | 11 | 35 |
| wnl-competitions | 80 | 80 | 76 | 236 | 80 | 80 | 76 | 236 |
| All pages | | | | 7913 | | | | 7907 |

The three live line breaks are back. The Kids Classes intro breaks before "Our experienced coaches". The Note paragraph breaks before "of the other weeks!". The Community Murph paragraph breaks twice after the link and once after "Stronger, together." The Memorial Day sentence stays in that paragraph.

The self-hosted faces are live's variable files: Epilogue v20, Heebo v28, Muli v34, and Muli v34 italic. Each is a weight range with the latin unicode-range. `font-display` is swap. Nothing preloads a font.

The lines still open on this machine are wraps at live's size, width, and letter-spacing. Round 7's preview measurement did not count them. Size and letter-spacing were not changed to force the wrap. Paragraph links stay the live red, `rgb(219, 58, 52)`, with no underline.

Lighthouse mobile on the local preview, after this batch. Order is performance / accessibility / best practices / SEO. About and kids accessibility stay at 92 because the live red measures 4.49:1 on white. That question is with Josh. The red stays.

| Page | Score |
|---|---|
| Home | 99 / 100 / 100 / 100 |
| About | 98 / 92 / 100 / 100 |
| Kids classes | 99 / 92 / 100 / 100 |

## Open questions

- Where GF18 should live, if it should be a page at all.
- Whether Josh has larger originals for the small captured heroes (about gym photo, pricing banner). The home hero is the live gym photo.
- Central Forms registration, the preview lead URL, Vercel project, and DNS are out of this job.
- Sunday has no clock range in the source, so it is not in schema hours.
