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
- **Never paint to the checker.** Don't add strips, stripes, partial overlays or shadows whose only purpose is to make sampled pixels match: edge columns, chosen rows, the band sampler. Use live's actual CSS: background position and size, overlay color and opacity, padding. If the gate still disagrees with real live CSS, report the line with live's values instead. (Rounds up to 9 added 16–24px edge strips to the home hero and box-shadow black bands; removed in round 10. v2.10 reads both page margins on desktop.)
- **Hidden text:** text a visitor can't see anywhere on the build page, but that live shows, is flagged. **Never hide words to pass a check.** If the gate looks wrong, report it instead. (Batch 1 hid the About Memorial Day paragraph. The real cause was the gate: live puts that text in the same paragraph as the one before it, and v2 compared only the first 80 characters. Fixed in v2.1.)
- **v2.7–v2.8 (11 Nov, after round 6):** round 6 measured 0 on v2.6 at 1920 and 1280, but on the preview the Kids Classes heading box covers the trust bar's phone number at 390, the home "offers" paragraph is 17px (live 16px) and wraps to an extra line, and the About flag band is visibly shorter. Cursor's report that the full-page screenshot paints the Call bar over "ARE YOU LOOKING…" was right. Now:
  - **Font size must equal live** (was ±2px).
  - **Fixed bars in the bottom half** (Call bar, reCAPTCHA badge) are hidden before the full-page screenshot.
  - **Covered check** samples the top, middle and bottom of each block, and flags covered text that exists only in the build.
  - **Band heights.** The left page margin is read top to bottom. Runs of a real page background color are matched to the build's same-colored band nearest the same spot, and each height must be within max(24px, 10%).
  - Round 6 on v2.8: home 10 / 10 / 5, about 7 / 7 / 4, kids-classes 3 / 3 / 5 (1920 / 1280 / 390).
- **v2.6 (11 Nov, after round 5):** round 5 measured 0 on v2.5, but on the preview, at full size, About was visibly shorter, Kids Classes at 390 looked letter-spaced, and paragraph links were underlined. v2.6 adds:
  - **Rendered line count.** Lines are counted from the text itself, not the box height (padding caused false alarms). Only paragraphs of 30+ characters are checked.
  - **Letter spacing within ±0.2px** (was ±1). Round 5 had 0.4–1px added to body text and 0.6px to the home card headings, where live is 0, which rewraps lines.
  - **Left edge on phones within ±4px** (was 24). The build gutter is 20px; live is 25–26px.
  - **Underline per run of words.** Live paragraph links are not underlined.
  - **Heading-to-heading gap within max(24px, 10%)** (was max(48px, 25%)), and **page height within 5%** of live. Round 5 About is 7,965px, live 8,525px; home 6,403px, live 6,861px.
  - Round 5 on v2.6: home 22 / 22 / 39, about 17 / 17 / 41, kids-classes 14 / 14 / 79 (1920 / 1280 / 390).
- **v2.5 (11 Nov, after round 4):** round 4 passed v2.4 on all three pages, but at full size Kids Classes at 390 was visibly off, and measuring it showed five things the gate couldn't see. v2.5 adds:
  - **Colors with transparency.** Live body text is `rgba(0, 0, 0, 0.7)`, a grey; the build uses solid black. v2.4 ignored the 0.7.
  - **Line height.** Live body text is 28px, the build 25.6px. Headings and menu links differ too. Limit ±2px.
  - **Line count.** The same words wrapping onto a different number of lines, for example home 390 "ONE OBSTACLE AT A TIME!" on 3 lines where live has 2.
  - **Color and weight of every run of words**, not only the first one. This catches the missing red links ("experienced coaches", "Thrivent Financial", "James River Church"), the missing blue "personal training" link, and the whole "Note:" paragraph in navy where live has only "Note:" in navy. The check follows the words wherever they sit on the page, so splitting a paragraph differently doesn't matter.
  - **Tighter color limits.** Text 6 (was 14). Background and band 8 (was 40), read as the real average color, not rounded to steps of 24. Live's light grey band `rgb(241, 245, 247)` behind the About partnership sections and the Kids Classes program sections passed before, because it is only 14 off white.
  - The live map was recaptured with v2.5. Round 4 on v2.5: home 51 / 52 / 56, about 65 / 64 / 56, kids-classes 182 / 182 / 174 (at 1920 / 1280 / 390).
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


## Batch 2 (from 11 Nov, after batch 1 passed)

Batch 1 (home, about, kids-classes) passed gate v2.15 at 0 on the preview at 1920, 1280 and 390, and passed Claude's full-size review. Batch 2 pages: **birthday-parties, schedule-birthday-party, summer-camps-in-springfield-mo, competitions, wnl-competitions, contact.**

Done means:
- `compare-layout` shows 0 for each batch 2 page at 1920, 1280 and 390, **measured on the Vercel preview**, not only on localhost.
- Batch 1 pages stay at 0, and no other page's total goes up.
- Claude's full-size review at all three widths passes.

What batch 1 taught (do these from the start):
- **Use live's real CSS values** (computed styles): font family, size, weight, letter spacing, line height, colors including alpha, padding, margins, background position and size, overlay gradients, and carousel heights. Read them from live; don't tune them to the gate.
- **Never paint to the checker:** no edge strips, odd-percentage stripes, partial overlays or box-shadow fills. If the gate still disagrees with real live CSS, report the line with live's values.
- **Never hide words.** Keep live's `<br>` line breaks and inline links (color, weight, no underline unless live has one).
- **Fonts:** the self-hosted live variable files are already in place; keep live's exact `font-family` stacks, including where live has no fallback.
- **Forms** on these pages keep the Central Forms wiring (siteKey, formKeys, clientSubmissionId retry, thank-you redirects, host gate). Match the form's look to live; don't change its behavior.

### Quality bar (Josh, 11 Nov)

Not pixel-for-pixel exactness, and far from sloppy. A page is done when someone comparing it with live at full size, at 1920, 1280 and 390, would not notice a difference. Every value still comes from live's computed CSS.

- **Must match:** anything a visitor would see. That covers form layout and field styling, list markers and icons, numbered lists, shaded boxes, column alignment, section spacing, missing bands or cards, and text that wraps differently in a way that changes the shape.
- **Not worth another round:** offsets of a few pixels, or a one-line wrap difference inside a block of the same height. Claude rules on these at full size; Cursor reports them rather than chasing them.
- The gate is a tool for finding differences; it is not the target. A 0 with a visible difference is not done. A few measurement-only lines with no visible difference can be.

### Merging (Josh, 11 Nov)

While this repo isn't serving the live site, Claude merges each PR once it's ready, without asking. That covers the batch PRs and, at the end, #1 into `main`. DNS, the live-site cutover and anything touching the live WordPress site still need Josh. Batch 1 (#3) was merged into `cursor/astro-rebuild` on 11 Nov.

## Batch 3 (from 11 Nov, after batch 2 passed and merged)

Batches 1 and 2 are merged into `cursor/astro-rebuild` (#3, #4). Batch 3 covers the program pages: **fitness-classes, personal-training, parkour, homeschool-sports-and-classes-springfield-mo, laser-tag, nerf-wars.** Batch 4 will cover meet-the-team, best-gyms-in-springfield and the thank-you pages.

Starting point on the batch 2 preview, gate v2.17 (1920 / 1280 / 390): fitness-classes 256/256/135, personal-training 383/387/169, parkour 205/204/103, homeschool 106/108/102, laser-tag 206/206/177, nerf-wars 179/176/151.

Done means (Quality bar above):
- Nobody comparing a page with live at full size, at 1920, 1280 and 390, would notice a difference. The gate (v2.18) finds the differences; it isn't the target.
- Batch 1 and 2 pages stay where they are, and no other page gets worse.
- All of batch 1 and 2's lessons apply from the start: live's computed CSS for every value; forms, icons, list markers, shaded boxes and section spacing all taken from live; no paint aimed at the checker; no hidden words; no allow entries; Central Forms wiring unchanged.
