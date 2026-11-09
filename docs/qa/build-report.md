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

## Open questions

- Where GF18 should live, if it should be a page at all.
- Whether Josh has larger originals for the small captured heroes (about gym photo, pricing banner). The home hero is the live gym photo.
- Central Forms registration, the preview lead URL, Vercel project, and DNS are out of this job.
- Sunday has no clock range in the source, so it is not in schema hours.
