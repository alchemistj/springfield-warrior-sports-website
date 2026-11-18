# Spec: launch batch B (15 Nov 2026), whole-site visual QA

These come from a side-by-side review of every page against live (https://www.springfieldwarriorsports.com) at 1440 and 390, with the top items re-checked by the architect. The bar: a picky person comparing with live at full size would not call any page sloppy. Batch A (#16) already covers the trust bar, the menu and phone bar, the booking page and the home page. Don't redo those.

## Broken things (fix all)
1. **Thank-you and registered pages** (`/registered/`, `/registered-for-day-camps/`, `/registered-for-csna-competition/`, `/registered-for-summer-fun-competition/`, `/registered-for-wnl-competition/`, `/thank-you-for-your-feedback/`): at 1440 the three-coaches photo covers the body text, including the Square link and the phone line. Keep the text in its own column, clear of the photo, as live does. On phones, text first, then the photo, not clipped.
2. **Summer camps, desktop:** the two tall photos beside the dates run down over the "Springfield Warrior Registration" paragraph. Nothing may sit on top of text.
3. **Contact, map:** the map box renders blank beige. It must show a working map (the Google Maps iframe), with the fallback picture visible until it loads. Check at 1440 and 390, scrolled into view.
4. **Phone images outside the column:**
   - best-gyms (every gym photo starts about 48px in and runs off the right edge; one starts at -66px)
   - about (Partnerships photos)
   - birthday-parties (pizza and battle photos)
   
   At 390 every image must sit inside the 24px gutters (left 24, right 366). Check every page with a script: no `img` wider than the column or outside it.
5. **Phone crops that cut off heads:** kids-classes (preschool, junior warriors, parkour), meet-the-team bios, birthday "Have Battles". Faces must be visible; use `object-position` or a taller ratio. The birthday party flyer image is shown whole, never cropped.
6. **Kids-classes Summer Camp / Birthday / No-School cards:** stray line breaks mid-sentence ("during our / week long day camp"); remove the `<br>`s. The cards are equal height, with the button inside the card.

## Layout (match live's grouping, inside the 900px column)
7. **Reviews scattered between sections** (kids-classes, birthday-parties, personal-training, summer-camps, contact): put each page's reviews together in one testimonials area near the end, before the closing band. One review per row, full width (Rule 4.2), all with the same band styling. Don't put a review between class or service blocks, and drop none (paragraph check: 0).
8. **Birthday "Create Amazing Memories":** the photo has fallen far below the text, leaving about 250px of empty space. Put it beside the text. "Have Battles" images must not touch the next band, and the last line needs padding.
9. **Big empty gaps:**
   - the white gap before the blue "Be an Everyday Warrior" band on competitions, kids-classes, meet-the-team and wnl-competitions
   - the empty area of about 500px above "In 2016 we had…" on about
   - the gap below the nerf "Notify me" button
   
   No section ends with more than its normal padding.
10. **Meet the team:**
    - Photos alternate sides and are much bigger than live, which makes the page very long. Use one consistent side and a size closer to live.
    - On phones, show each photo whole, with the head and face visible.
11. **Parkour, personal-training, laser-tag photo pairs:** at 1440 the photos are jammed against the text. Leave a clear gap of about 24px or more. The personal-training intro heading needs a gap before the first paragraph.
12. **Headings and buttons:**
    - Headings never leave a one-word orphan line (contact hero "Goals", laser-tag "Party?", fitness "Levels"); use `text-wrap: balance` on headings site-wide.
    - Buttons never wrap to two lines or leave an orphan ("Try your first class for just / $5!" on homeschool at 390, "Contact our personal / trainers" at 1440, nerf "Book Now"). Buttons are never underlined.

## Follow-ups from batch A
13. **Booking page `/schedule-birthday-party/`:** the three live steps are run together in one paragraph ("1. Fill out… 2. We will… 3. Look forward…"). Show them as a compact numbered list of three short lines, same words. On phones, tighten the big gaps between form fields to normal form spacing. The first field stays above the fold at 390×844.
14. **Home:** "Open Gym Hours" is a proper heading again, as on live (red, same style as other sub-headings), not small text. The "Be an Everyday Warrior" coaches and arc image is closer to live's size; it's much smaller now.

## Done means
- A side-by-side screenshot against live at 1440 and 390 for every page touched, attached or linked in the PR.
- The image-in-column script passes on every page at 390, and no text has an image on top of it.
- `scripts/qa/paragraphs.mjs` on the preview reads 0, `vitest` and `astro build` pass, and there are no console errors.
- Report: a table of items 1–12 with what changed and preview links per page, plus the model used.

Content questions for the client, not in this batch: the 2024 WNL event, the past CSNA 19 Sep 2026 date, the past summer camp dates, Summer Fun 2024, "Parkour currently unavailable", and the No-School Day Camp card. Leave these words as they are.
