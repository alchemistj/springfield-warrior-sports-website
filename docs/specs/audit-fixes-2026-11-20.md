# Spec: Sonnet audit punch list fixes (Nov 20, 2026)

Branch: `claude/sws-audit-fixes`, cut from `cursor/astro-rebuild` at `dadad65`. PR into `cursor/astro-rebuild`. Never merge, deploy or touch DNS.

Sources, read before building:

- Punch list (57 items): Google Doc "Springfield Warrior Sports rebuild: punch list before merge". Every item it lists is copied below with the change to make, so this file is enough to build from.
- QA checklist: `alchemistj/ff-architect` branch `claude/sleepy-bardeen-8oi8bk`, `docs/sop/wp-to-astro-rebuild-qa-checklist.md`.
- Build rules: `alchemistj/ff-architect` `docs/sop/astro-full-build-rules.md` (Rule 4 layout, 4.2 reviews, 5 header, 6 sticky bar, 7 phone, 8 hero).
- Copy: Google Doc "Springfield Warrior Sports rebuild: copy changes for the punch list fixes". The final words are pasted below under "Copy". Place them exactly. Do not write, reword or shorten any visible text. If a fix seems to need words that are not here, leave it and say so in your report.

Numbering: `#n` is the item's place in the punch list, 1 to 57 (High 1-9, Medium 10-41, Low 42-57).

## Ground rules

1. Fix the cause in one place. Site-wide problems (buttons, reds, forced breaks, photo pairs, reviews, H1s) get one shared rule or component, not per-page patches. No one-off CSS for one card in a set.
2. Astro scoped styles beat global CSS. After a change, measure the computed value in the browser; don't assume an override applies.
3. Keep every live sentence unless this spec says to change it. Run the paragraph check (`scripts/qa/paragraphs.mjs` if present) and add a dated IGNORE line for each sentence this spec removes on purpose.
4. Phone numbers only from `site.phone` (Rule 7). Never type digits in a component.
5. Leave the held items (bottom of this file) exactly as they are.
6. Before reporting: `npm run build`, `npm run check`, `npm run lint`, `npm test` (vitest + Playwright) all pass. Update any test that asserted the old header Call pill or the old quick links. Then a Playwright pass on every page at 390 and 1440 that measures: sideways scroll, clipped buttons or buttons under 44px tall, tel links that wrap, single-word last lines in headings/paragraphs/buttons, side-by-side boxes of unequal height or with more than 40px empty inside, white gaps between top-level sections, and a grouped inventory of computed button styles (expect 2-3 variants). Put the numbers in your report comment, page by page. Don't commit screenshots.
7. Push only to `claude/sws-audit-fixes`, normal fast-forward. No new PR, no merge, no force push.

## Decisions already made (don't revisit)

- No button in the menu, desktop or phone. The red Call pill in the phone header goes.
- Reviews: one review per full-width band, placed between sections after the section it supports (Rule 4.2). Never two stacked or side by side. This overrides launch batch B's "group near the end".
- Header quick links: Kid Classes, Adult Classes, Birthday Parties, Personal Training (add Personal Training as the fourth). Summer Camps stays out of the header until March (Josh, Nov 11; see the comment in `src/data/site.ts`).
- Fonts: keep the four families (Heebo, Muli, Epilogue, Literata). Remove font files nothing references.
- Redirects: leave `vercel.json` redirects as they are.

## High

- **#1 Phone header Call pill.** Remove `.bar-call` from `Header.astro` and its CSS. Phone header = logo + hamburger only. Accept: at 390 no element with a `tel:` link or button styling is in the header bar.
- **#2, #3 Parkour status.** HELD. Don't touch.
- **#4 Summer camps call-and-register line.** In `batch2/CampsBody.astro`, replace the five "Summer Camp Pricing" paragraphs with copy C1. Accept: no "register over the phone" anywhere in the build (grep `dist`).
- **#5 Summer camps heading.** Replace H2 "Springfield Warrior Registration" and its paragraph with copy C3. One waitlist section only (the existing "Get notified when dates are set" form).
- **#6 Birthday parties H1.** The hero line becomes the page's only H1, in title case: "High-Energy Kids' Birthday Parties in Springfield, MO" (real text, not CSS uppercase). The current small H1 "Kids Will Have a Blast, and You Can Relax" becomes an H2 styled like the other H2s on the page. Accept: exactly one H1, inside the hero, at both widths.
- **#7 Laser tag photo height.** In "Come Join the Fun! Don't Miss Laser Tag Night", the photo column matches the height of the text + form column, top aligned, `object-fit: cover`. Same for the private-party photo pair (see #17 photo pairs). Accept at 1440: photo bottom within 10px of the column's last element bottom.
- **#8 Competitions hero (phone).** Remove the ~48px grey strip between header and hero; the dark overlay covers the whole hero evenly; normal top padding (same as /wnl-competitions/) above the intro. Accept at 390 and 500: hero top = header bottom, one overlay layer covering 100% of the hero.
- **#9 CSNA confirmation page payment line.** HELD (copy). But do #41 on it.

## Medium

- **#10 Main menu.** Quick links per Decisions. Hamburger shows each link once (no repeat of the top bar's Contact / About / Sign Our Waiver: see #11), and ends with the phone number as plain text `site.phone.display` linked to `site.phone.tel`, styled as a menu link, not a button and not the word "Call". No buttons in the hamburger.
- **#11 Phone header height.** Below `md`, hide the black utility bar; its links (Contact, About, Sign Our Waiver) appear only inside the hamburger. Desktop keeps the utility bar. Accept at 390: header total height under 80px.
- **#12 Sticky bottom bar.** Two buttons, Call (primary style) and Contact Us (secondary style), using the shared button styles from #13, same font as every other button. On `/contact/`, hide the Contact Us button so Call spans the bar.
- **#13 Buttons and reds.** One red: `#d6352f` everywhere (footer social circles currently `#db3a34`). Two shared button styles: primary = filled red pill; secondary = outline pill (navy outline on light backgrounds, white outline on dark backgrounds). Replace the solid white pills (about, contact, best gyms bands), the solid navy "VISIT WEBSITE" (best gyms), the home white-with-navy-outline phone button and the Muli sticky pills with these two. Same font, size, weight and letter spacing for both. Labels may wrap; no clipping; min height 44px. Accept: the computed button inventory shows 2 groups (3 at most if a size variant is needed).
- **#14 Footer.** Give the Visit (hours) column more width so each hours entry is one line at 1440 (e.g. grid 1fr 1fr 1fr 1.6fr, or hours set in two columns). Columns top-aligned and visually balanced. Also #56.
- **#15 Reviews one per band.** Apply the decision on kids, birthday parties, summer camps, personal training and about (home is #18). Use the existing `ReviewBand` (one review each), placed after the section it supports, a couple of sections apart, never two in a row. Keep every review; none is dropped. On summer camps the birthday review (Jennifer L.) goes last. The "Client Testimonials / What Our Clients Say" label appears at most once per page, as one small label (see #30).
- **#16 Forced line breaks.** Remove hard `<br>` / one-line-per-`<p>` splitting mid-sentence on home cards, kids, about, team bios, birthday, laser tag, personal training and summer camps. One paragraph per idea. Use a non-breaking hyphen or `white-space: nowrap` for ranges like "6-15" and "3-6". Example: the kids Youth Summer Camp card's five `<p>` lines become one paragraph.
- **#17 Photo pairs.** One shared rule for two-photo stacks/pairs on kids, about, birthday, laser tag, nerf and summer camps: either one photo, or two photos of equal height and aligned tops, with the photo column's total height matching the text column, `object-fit: cover`, faces not cut (set `object-position` per image where needed, e.g. the kids CSNA team photo). On phones, photos are about 4:3. The home "Get Ready To" photos stay where batch A put them (see #43).
- **#18 Home reviews band.** Jennifer L. and Lee C. become two separate full-width review bands, one at a time, per batch A item 8.
- **#19 Home "Everyday Warrior".** Buttons on one row (primary + secondary per #13, wrapping only if they don't fit), photo height matched to the text column.
- **#20 Kids "Don't forget" heading.** Use copy C5. Also the camp card text as one paragraph (#16).
- **#21 Kids class times.** Restore the two schedule lines as on live: "Mon-Fri 4-4:30pm or 4:30-5pm" and "Mon, Thur, & Fri 5-5:30pm or 5:30-6pm" (live's own words, two lines). The Test Week note is one paragraph.
- **#22 Kids gallery (phone).** "See How Much Fun Your Kid Will Have" grid fills the column width at 390 and 500 (no empty band on the right).
- **#23 Personal training review names.** One dash style site-wide (use the hyphen "- " form the kids page uses), not upper-cased by CSS. "Will and Koren Wilson" becomes "Will and Koren W.". Leave "- Client" as it is (held).
- **#24 Personal training order.** Reviews before the "Let's Talk Strength" form as on live, spread one per band per #15.
- **#25 Parkour layout only.** Don't change any parkour words or prices. Do: prices in the "Temporarily Unavailable" band each on their own line with spacing; benefit paragraphs get normal paragraph spacing; remove the warning emoji from the H4 heading text (emoji only, keep the words); the H1 becomes "Parkour Gym in Springfield, MO" (pipe and brand removed) with contrast help on the photo (overlay or text shadow).
- **#26 Homeschool.** Remove the duplicate "Availability: Tuesdays and Thursdays" line (keep the one inside the full details). Fix "$ 5" to "$5". The closing band's H4s become `<p>` body copy (same size as other bands' body copy). Replace the last line with copy C8: the sentence as a paragraph, then a primary button with C8's label linking to the existing trial link. Remove the ~50px gaps between card paragraphs.
- **#27 Summer camps form block.** Replace the "Cost: ..." and "Questions? Call ..." lines with copy C2 (price is now stated once, in C1). About 20px of space above the "required fields" note so it doesn't read as part of the sentence above. "Note:" is gone via C1.
- **#28 Birthday flyer and list.** Crop the invitation flyer to its frame (no white strips; `object-fit: cover`), height no taller than its text. Bullets stay in one column for the whole list. Don't change the flyer image itself (date held).
- **#29 Birthday bullets (phone).** Normal paragraph spacing; no hard breaks in deposit and guest bullets.
- **#30 Birthday headings.** One H2 style across the page (the heavy style). "Pizza Birthday Party With / No Clean Up!" becomes one line, AP title case: "Pizza Birthday Party with No Clean Up!". H3/H4 one colour. The reviews label is one small label on its own band.
- **#31 Birthday closing band.** Replace the page's final "Be an Everyday Warrior!" band with copy C6: heading, paragraph, primary button "Book Your Party" to `/schedule-birthday-party/`, and the phone number as the secondary button. Other pages keep the Everyday Warrior band.
- **#32 Booking page steps and form.** The "1. 2. 3." lines become a real `<ol>` with spacing, at least 20px below the H1. Even field gaps (one value). Form width fills the 900px column or a sensible max (e.g. 640px) aligned with the heading.
- **#33 Laser tag intro.** The five-sentence intro becomes `<p>` paragraphs (not H4). "Cost:" bullets get space above. One paragraph width and one body text colour (the "Note:" line is not blue).
- **#34 Competitions waitlist.** Centre the whole block (intro, H2, note, labels, button) consistently; H2 the same size as other H2s with normal space above; banner photo centred at a consistent width.
- **#35 Competitions intro.** Replace "Check the links below for scheduled competitions and information!" with copy C4.
- **#36 WNL page.** Intro same size and colour as other pages' intros; "Calling all Ninjas!" its own sentence (live words, just not run into the next); "WNL Regional Qualifiers" becomes an H2; waitlist styling identical to /competitions/.
- **#37 About.** Remove the ~40px white strip between the blue "Perseverance" band and the grey James River Church band. "Perseverance:" plus the sentence-length H2 become one heading ("Perseverance") with the sentence as an intro paragraph under it (same words). Leave "Clean up" as is (held).
- **#38 About closing band and phone gaps.** Closing CTA band centred; its phone button uses the secondary style (#13). On phones, even 40-64px gaps after the flag image and before Community Partnerships.
- **#39 Meet the team.** H1 inside the 900px column at every width, clear of faces, real `<h1>` at 390 too. Bio photos match their text height (`object-fit: cover`, faces visible).
- **#40 Other confirmation pages.** HELD (copy). Only make the link colour the same on all five pages.
- **#41 Confirmation pages H1.** On /registered/, /registered-for-csna-competition/, /registered-for-day-camps/, /registered-for-wnl-competition/ and /thank-you-for-your-feedback/, the visible red heading is the page's H1, inside `<main>`; remove the empty hidden H1. Same layout on all five (CSNA gets the same cutout image as the others).

## Low

- **#42 Home hero buttons.** HELD for Josh's call. Don't add.
- **#43 Home cards.** Keep batch A's layout. Even card heights and tops across a row; the two "Get Ready To" photos the same height with aligned tops; card button labels may wrap at 390 (no running to the card edge).
- **#44 Home programs strip (phone).** Compact the dark strip of five links at 390: smaller vertical padding and a two-column or inline wrap so it is under about 140px tall. Same words.
- **#45 Kids spacing.** Remove the ~140px white below the Test Week note; space between stacked H2s; "Pre-School Warriors" and "(3-6 Year-Olds)" become one H2 (same words, one element); card "Class Times" / "Practice Times" become H3s.
- **#46 Fitness classes.** "ARE YOU LOOKING FOR A FUN AND UNIQUE WAY TO STAY FIT?" becomes a heading in title case: "Are You Looking for a Fun and Unique Way to Stay Fit?" (no CSS uppercase). Benefit cards lose their boxes and forced break (article-style copy, Rule 4.1). The Everyday Warrior band centred like the shared FinalCta.
- **#47 Personal training cards.** Card headings top-aligned across the row; equal heights without empty bottoms; drop the leading dash on the trainer role; how-it-works item two the same colour as the others; the red H2 on the dark form photo gets contrast help (overlay or white).
- **#48 Nerf wars.** "$220" not bold red (normal body emphasis at most); included-list bullets same weight/colour as paragraphs; intro measure matches the rest of the page; photo pair per #17; at 390 the Nerf Nights heading and text come before its photo.
- **#49 Laser tag phone order.** At 390, Laser Tag Night H2 and text before its photo; 16-24px under H2s; "We look forward to hosting you." uses the page's normal H3 weight.
- **#50 Birthday links, policy text, hero crop.** One link style on the page (the site's standard link). The Book Now cancellation policy text normal body size and weight with a readable overlay, no orphaned "$60 fee."; hero `object-position` so faces show.
- **#51 Booking page meta description.** Set the description to copy C7 (it currently reuses the summer camps blurb). Keep noindex.
- **#52 Contact.** Map zoomed out one or two levels to show the neighbourhood, and the map column matches the form height (or runs full width under it). Visible labels above each form field (use the field's existing placeholder words as the label text). Contrast help on the red H1 (overlay).
- **#53 Meet the team Open Gym button.** Point "Try Open Gym for $10" to the same Square link the about and contact pages use.
- **#54 About collage and quote.** BBBS, Supplement Superstore, Murph and Adopt-a-Highway: one photo per block matched to text height (or an aligned pair per #17). Quote icon aligned with its left-aligned text.
- **#55 Fonts.** Delete woff2 files that no `@font-face` or import references (check per-weight files against the variable files). Keep the four families.
- **#56 Footer hours at 390.** The preschool hours line breaks at a sensible point ("Preschool hours:" then "Tuesday mornings from 9:30am-11:30am"), no orphan, time range kept together.
- **#57 Honeypot and best gyms button.** The honeypot "Website" field stays hidden from view and from screen readers (`aria-hidden="true"`, `tabindex="-1"`, `autocomplete="off"`, visually hidden wrapper). Best gyms "VISIT WEBSITE" uses the shared button style (#13).

## Copy (place exactly; `{PHONE}` = `site.phone.display` linked to `site.phone.tel`)

**C1** (summer camps, under the "Summer Camp Pricing" heading; four paragraphs):

A week of activities and snacks at Springfield Warrior Sports camps costs $179 per child.

We offer discounts for members and siblings. They apply once registration opens, and they may not be combined.

Summer 2027 camp dates have not been set yet. They will be posted in the spring, so sign up below to get notified, or call {PHONE} with questions.

If your child can't attend the entire week, camp fees can be pro-rated.

**C2** (summer camps, the one line under "Get notified when dates are set"):

Ages 6-15. Questions? Call {PHONE}.

**C3** (summer camps, replaces "Springfield Warrior Registration" and its paragraph):

Heading: What Kids Get at Camp

At our Springfield Warrior Sports camps, your kids won't just have fun; they'll become physically stronger, learn life-long nutrition habits, and improve their coordination skills, all while making new friends!

**C4** (competitions intro, replaces the last sentence of the second paragraph):

Dates for both are coming soon, so sign up below and we'll let you know when they're set.

**C5** (kids classes heading):

Don't Forget About Summer Camps and Birthday Parties!

**C6** (birthday parties closing band):

Heading: Ready to Book Your Party?

Parties run an hour and a half and include open play and an obstacle course set up and run by our crew. Take the stress out of your party planning. Schedule your party with us, and let us do the rest.

Button: Book Your Party

**C7** (booking page meta description):

Book a kids' birthday party at Springfield Warrior Sports in Springfield, MO. Pick your date and send the form, and we'll take it from there.

**C8** (homeschool closing band):

Call {PHONE} for more information, or book a trial class for only $5.

Button: Book a $5 Trial Class

Use curly apostrophes (’) in visible text to match the rest of the site.

## Held (don't change)

- #2, #3 and the words/prices in #25: parkour status, waiting on the client.
- #9 and #40 wording: confirmation pages, waiting on the client (retire or keep).
- #23 the "- Client" review name; #28 the flyer image date; #37 "Clean up"; all typo fixes in live copy; nerf/laser prices; the address wording; best-gyms competitor claims; class times vs posted hours.
- #42 home hero buttons: Josh's call.

## Report

When done, comment on the PR: the head commit, every item number with done / held / couldn't do (and why), the check results, and the 390/1440 Playwright measurements page by page.
