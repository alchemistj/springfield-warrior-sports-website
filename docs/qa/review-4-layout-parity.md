# Review 4: layout parity with the live site, measured

Reviewer: Claude, 11 Nov 2026, after Josh found the home hero off on the real preview. Earlier reviews compared shrunken screenshots at one width. That missed most of what is wrong. From now on the gate is a measurement, not an eyeball.

## The gate

Two scripts in `scripts/qa/`:

- `layout-map.mjs <baseUrl> <outDir> [widths]` opens every page in `source/pages.json` in Chromium at each width. It scrolls to load lazy images and records what a visitor sees, in order: each heading, paragraph or list item (text, left edge, width, font family, size, weight, color, alignment), each photo (file name, left edge, width, including background-image photos), each filled button (text, color, width), the full-width band colors, and whether the page scrolls sideways.
- `compare-layout.mjs <liveDir> <buildDir> <report> [--allow file]` compares a build map with the live map. It lists every difference: missing or extra headings, text, photos and buttons; wrong order; left edge off by more than 24 px; width off by more than 12%; wrong font, size (±2 px), weight, color, alignment or band colors; sideways scroll. It exits 1 if anything is left.

The live map is committed in `docs/qa/layout-map/live/{1920,1280,390}/<slug>.json`, captured 11 Nov 2026 from www.springfieldwarriorsports.com. Don't regenerate it; it is the target.

To check your work:
```
npm run build && npx astro preview --port 4321 &
node scripts/qa/layout-map.mjs http://localhost:4321 /tmp/build-map 1920 1280 390
node scripts/qa/compare-layout.mjs docs/qa/layout-map/live /tmp/build-map docs/qa/layout-report.md --allow scripts/qa/layout-allow.json
```
Then stop the preview server.

`scripts/qa/layout-allow.json` lists the differences the spec allows on purpose: the trust bar, the hamburger and mobile bar, the address wording Josh chose, and no reCAPTCHA badge. Add an entry there only for a difference the spec or Josh asked for, with a `reason`. Never add one to make a page pass. Claude reviews every entry.

Baseline on the current preview (40d1953): **3,693 differences**. The full list is in `docs/qa/layout-report-baseline.md`.

## Gate v2 (11 Nov, after batch 1)

Batch 1 passed gate v1 at 0 differences on home, about and kids-classes. Claude then looked at those pages at full size and found problems v1 could not see. The gate now also checks these. Everything below is measured, not eyeballed:

- **Header and footer** are measured: menu links, top-bar links and footer text, with font, weight, size and position. Live uses Heebo 600 for the menu; the build uses Muli 700.
- **Text inside bold or other inline tags** counts. Example: "The best part?" is weight 500 in navy on live.
- **Hidden content doesn't count as present.** Slides scrolled out of view, opacity 0 and display:none are skipped on both sides.
- **Icons** (inline SVG, 8–72 px) must match in count, order, color and size. Home has 13 on live (red clocks on Open Gym Hours, and others) and 5 in the build.
- **Pixels behind each matched heading, text block and photo** must look like live. This catches a wrong photo crop and dark text on a dark photo. Example: home "Be an Everyday Warrior" has the photo zoomed over the text, at pixel difference 117–176 against a limit of 38. The Parkour and Personal Training card crops also differ.
- **Covered text** (another element on top of it) is flagged.
- **Hidden text:** text a visitor can't see anywhere on the build page, but that live shows, is flagged. **Never hide words to pass a check.** If the gate looks wrong, report it instead. (Batch 1 hid the About Memorial Day paragraph. The real cause was the gate: live puts that text in the same paragraph as the one before it, and v2 compared only the first 80 characters. Fixed in v2.1.)
- **v2.3 (11 Nov):** full-width band color is read from the left page margin beside each heading and text block; photo brightness must be within 25% of live (hero overlays); content clipped vertically (live's mobile testimonial slider) or below the page doesn't count as visible.
- **v2.2 (11 Nov):** also checks the background color around each heading and text block, read from the screenshot (so grey or blue bands and white cards count), the gap from each heading to the next (section padding), and letter spacing.
- **v2.1 (11 Nov):** the capture scrolls slowly enough for live's lazy-loaded sections, text blocks keep their full text, and text split into a different number of paragraphs counts as the same text.

The live map was recaptured with v2 (JSON plus a JPEG screenshot per page and width). Gate v2 on the batch 1 preview: home 125 / 125 / 96, about 76 / 76 / 51, kids-classes 120 / 120 / 83 (at 1920 / 1280 / 390). Total 8,239, because v2 measures far more items than v1. Batch 1 isn't done until those three pages are at 0 on v2.

## What the numbers say is wrong (all pages)

1. **No shared content column.** Live content sits in a centered column. At 1920 px, home text starts at x≈385 and inner pages at x≈425–510. The build pins text to x=28, or to the right edge, or stretches headings to 1,100–1,700 px. Hero text is included. This is one layout fix: a wrapper with the live max width and centering, used by every section and every hero. Take the width from the live map, not by eye.
2. **Body text weight and color.** Live body text is Epilogue (or Muli where the map says so), weight 400, color rgb(0,0,0) or the exact grey in the map. The build uses weight 300 and rgb(51,51,51). Epilogue 400 is not even loaded, which is why Josh saw a fallback font in the hero subhead. Self-host every weight the live map uses: Epilogue 300/400/500/600/800, Heebo 400/600/800/900, and Muli 400/700. `font-display: swap`, no preload.
3. **Alignment.** Many sections are centered on live and left-aligned in the build (about 280 items). Follow the `align` value in the live map.
4. **Missing words.** About 270 headings and 190 paragraphs from live are missing from the build. Examples: the "⚠️ TEMPORARY UPDATE" notices, "Here's how we're different", and the birthday "Cost $179" and "Availability" blocks. Every one must be on the page, in the live order. This is copy, so it is word for word.
5. **Page structure on inner pages.** For example, About has the wrong hero photo, sections in the wrong order, and is missing the flag section, the blue Perseverance band and the 2×2 photo grid. Kids Classes has the hero subtitle missing, the intro headings swapped, navy buttons turned red, and the arrow lists gone. Competitions is left-aligned where live is centered, and its form title and footer copyright bar are missing. Follow the live map's order of headings, photos and buttons exactly.
6. **Buttons.** Card buttons are fixed at 491 px wide on live; the build sizes them to the label. Match each button's width and color from the map. Kids Classes buttons are navy on live.
7. **Band colors.** Each page's sequence of full-width background colors must match (`section colors differ` lines).
8. **Testimonials.** Live shows all 9 testimonials, two at a time, in a slider. The build stacks all 9. Rebuild it as a two-up horizontal slider using CSS scroll-snap, with the live arrows or dots if the live site has them. Keep JavaScript to the minimum and add no library.
9. **Partner logo band.** On home, the logos have different sizes and positions, and there is an extra Springfield Warrior logo that isn't on live (it appears on every page). Match live.

## Batches

Do this in order. Each batch is done only when `compare-layout` shows **0 differences** (after allowed ones) for that batch's pages at **1920, 1280 and 390**, and the total for every other page has not gone up.

- **Batch 1 (this job):** global fixes 1, 2 and 3 (content column, fonts and weights, alignment), then **home**, **about** and **kids-classes** to zero.
- Batch 2: birthday-parties, schedule-birthday-party, summer-camps, competitions, wnl-competitions, contact.
- Batch 3: everything else.

## Keep

Routes, redirects, the `vercel.json` noindex header, forms logic (Central Forms, host gate, retry id, thank-you redirects), phone rules, the address decision, Lighthouse targets, first-frame hero rules, mobile bar and hamburger.

## Report

At the end of each batch, add to `docs/qa/build-report.md` the before and after totals per page at each width, the allow entries you added with reasons, and the Lighthouse mobile scores for home, about and kids-classes.
