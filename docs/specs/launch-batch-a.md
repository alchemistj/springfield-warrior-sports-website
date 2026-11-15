# Spec: launch batch A (Josh, 15 Nov 2026)

Josh reviewed the home page against live and called it "nowhere near ready". These are his decisions plus the home page fixes. The bar is still "not pixel-for-pixel, and far from sloppy": every change is judged side by side with live (https://www.springfieldwarriorsports.com) at 1440 and 390.

## Josh's decisions (do exactly this)

1. **Trust bar: remove it from every page.** It's `section.trust` in `src/components/VenuePage.astro`, with its CSS in `src/styles/global.css` and `system.css`. The home page's dark links strip under the hero (Kids • Adults • Summer Camps • Community • Birthday Parties) stays. Record in `docs/sop/astro-full-build-rules.md` or a site decision note that Rule 9 is waived for this site (Josh, 15 Nov). Update tests that expect it.
2. **Sticky phone bar** (`src/components/StickyCallBar.astro`, `stickyBar` in `src/data/site.ts`): **Call** and **Contact Us** (`/contact/`). No Book a Party.
3. **Desktop menu** (`src/components/Header.astro`): remove the red "Book a Party" button (`nav-cta`). "Birthday Parties" stays as a normal link. Check the mobile menu too.
4. **Booking page `/schedule-birthday-party/`: rebuild as a plain booking page.**
   - No hero image.
   - The H1 is "Book a Birthday Party". Under it, one line built from the live steps' own words (fill out the form, we confirm the date by phone and collect the $179 fee).
   - Then the form straight away: on a 390×844 phone the form's first field is above the fold.
   - At most one review, after the form.
   - Keep the Central Forms wiring exactly: formKey, field names, thank-you behaviour.
   - **noindex** (`<meta name="robots" content="noindex, nofollow">` like the thank-you pages), and remove it from `src/pages/sitemap.xml.ts`.
5. **Home page: remove the "Day Camps for School Breaks" card** (`src/components/HomeBody.astro`). Its live link is a deleted page that WordPress redirects to summer camps; the offer may no longer exist.

## Home page fixes (match live's layout and feel, inside the 900px column)

6. **"Get Ready To" section:** one section with two columns, as on live: the two photos in the left column, and the intro plus Open Gym Hours together in the right column. Today the intro sits alone with empty space beside it and the hours drop into a second section. On phones: intro, hours, then photos.
7. **"Springfield's Best Obstacle Training Gym" cards:** one continuous list, as on live.
   - Photo left, text right, on every card; no alternating sides.
   - About 16–20px between cards.
   - Real padding (about 20–24px) on the text side of every card; text never touches the card edge.
   - Remove the big empty gap between the section heading and the first card, and between cards.
   - No review between cards.
8. **Reviews on home:** one testimonials band after the cards, one review at a time, full width (Rule 4.2). Keep live's two (Jennifer L., Lee C.). Move the other two home reviews (Courtney C., Nick P.) to birthday-parties or kids-classes, where the rest already live, so no review is dropped. Re-run `scripts/qa/paragraphs.mjs`: no missing review.
9. **"Be an Everyday Warrior":** back to live's look:
   - a white background
   - the three coaches in front of the red arc, all three fully visible (today they're cropped on a red band)
   - the copy on the left, with the "Try Open Gym for $10" button and the phone button
   
   It no longer needs to be a red closing band (Josh's call; it overrides Rule 4.3 here).

## Done means

- Side-by-side screenshots of the home page and `/schedule-birthday-party/` against live at 1440 and 390, attached in the PR, plus one other page showing the trust bar is gone.
- `vitest` and `astro build` pass. Update tests for the removed trust bar, the removed card and the moved reviews, with a comment saying why.
- `node scripts/qa/paragraphs.mjs <preview>`: 0 issues.
- No console errors; no sideways scroll at 390.
- Report: what changed per item (1–9), preview links for every changed page, and the model used.
