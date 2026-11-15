# Spec: launch batch C (15 Nov 2026), last polish before launch

These come from a fresh side-by-side re-review of every page after batches A and B, plus measurements. The bar is the same: nothing a picky person would call sloppy next to live.

## Blockers (measured)
1. **Summer camps, phone (390):** the registration form is about 401px wide in a 390px screen. The inputs, the selects and "Submit and continue to payment" are clipped at the right edge. Every field and the button fit inside the 24px gutters.
2. **Competitions, phone:** the "Register now by filling out the form below" button holds about 410px of text in a 340px pill, so the text is cut off. **Correction to batch B's "buttons never wrap":** a button must never clip its text. Short buttons stay on one line; when the text can't fit at 390, it wraps to two centred lines with comfortable line-height and padding. Same check site-wide: no element with `scrollWidth > clientWidth` among buttons or links styled as buttons, at 390 and 1440.
3. **Homeschool, desktop (1440):** "Try your first class for just $5!" is cut off inside its card (text 318px, button 289px). It must show the full text.

## Polish
4. **Meet the team:** at 390 the H1 runs to the screen edges; give it the 24px gutters. At 1440 the title text sits over a person's face; place or size it so no face is covered. Same gutter check for the H1 on every hero.
5. **Booking page:** add normal top padding between the header and "Book a Birthday Party", and a normal gap above the Submit button. No hero; that's Josh's decision.
6. **About, phone:** in the Big Brothers Big Sisters and Supplement Superstore photo pairs, heads are cut off. Show faces.
7. **Kids classes:**
   - The Summer Camp, Birthday and No-School card photos show only a sliver, which cuts off kids' heads. Show more of the photo.
   - Remove the empty gap above each card's button.
   - The heading touches the hero bottom on phones.
   - There's about 180px of dead space after the Note.
   - The "Schedule a $5 trial class" button touches the photo grid.
   - A white strip sits before the blue band.
8. **Birthday parties:**
   - At 390, the "Warrior Sports Takes the Stress Out…" H2 is a five-line, oversized stack touching the section's top edge. Use the normal H2 size and padding.
   - Remove the large gaps before that section and between the heading and the poster, at both widths.
   - The poster touches the paragraph below it.
9. **Contact, phone:** there's a blank gap of about 600px where the map should be. The map (or its fallback picture) shows on phones, with normal spacing.
10. **Spacing, so nothing touches:**
    - personal training: the photo pair touches the hero on phones, and the H1 is jammed under the photos; "What Our Clients Say" touches the quote icon
    - nerf wars: the "Party Breakdown" heading is tight to the photos
    - parkour: "More Than Just Physical" is tight to its paragraph, and the hero title wraps badly ("| Springfield Warrior Sports" alone on a line; "MO | Springfield" breaking mid-phrase). Balance it.
    - best gyms: the first photo touches the intro box on phones
    - summer camps: the "Summer Camp Pricing" and "Springfield Warrior Registration" headings are tight to the block above
    - about: the Community Murph photos sit about 10px under the James River photos
11. **Home, phone:** `.bullet-stack` is 396px wide in a 390px screen. It fits.

## Done means
- At 390 and 1440 on every page:
  - no element wider than the viewport (excluding fixed ones)
  - no clipped button text
  - every H1 at least 16px from the screen edges
  
  Report the script output.
- Side-by-side screenshots against live at 1440 and 390 for every page touched.
- `scripts/qa/paragraphs.mjs` reads 0, `vitest` and `astro build` pass, and there are no console errors.
- Report: a table of items 1–11, preview links per page, and the model used.
