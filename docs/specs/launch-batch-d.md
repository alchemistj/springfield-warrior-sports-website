# Spec: launch batch D (Josh, 16 Nov 2026): out-of-date content

Josh: "the dates, out of date content definitely needs cleaned up." Today is 16 Nov 2026. Nothing on the site may advertise or take registrations for an event that has already happened. Plan approved by Josh: the event pages say the next dates are coming soon, and their registration forms become a short "Get notified when dates are set" form, the same `event-waitlist` pattern Nerf and Laser Tag already use. The real registration forms come back when the client sends new dates.

## Changes
1. **WNL competitions (`/wnl-competitions/`):**
   - Remove the October 26, 2024 qualifier details: the date, the early-bird and late pricing, the deadline lines, and the "10-26-2024 WNL Competition Registration Form" title.
   - Keep the evergreen copy about what WNL is and why to compete.
   - Add one short line: "The next WNL regional qualifier dates are coming soon. Get notified below or call (417) 894-7319."
   - Replace the registration form with an `event-waitlist` form: Name and Email, as on Nerf. The event name is "WNL Competition – next dates". It shows a success message on the page, with no redirect to the old thank-you page.
2. **Competitions (`/competitions/`):**
   - Remove the September 19, 2026 CSNA block: the date, start time, price, the "Register now…" button, the Square checkout link and the "2026-9 CSNA September 19th Form".
   - Keep the evergreen competitions copy and the link to WNL.
   - Add "The next CSNA team competition dates are coming soon."
   - Add an `event-waitlist` form; the event name is "CSNA Competition – next dates".
3. **Summer camps (`/summer-camps-in-springfield-mo/`):**
   - Remove the "Summer Camps in Springfield — 2026 Dates" heading and week list, and the registration form with its 2026 week checkboxes.
   - Keep the description, pricing ($179 a week, discounts, pro-rating note) and photos.
   - Add "Summer 2027 camp dates will be posted in the spring. Get notified below or call (417) 894-7319."
   - Add an `event-waitlist` form; the event name is "Summer Camp 2027 – dates".
   - Any other "2026" wording on the page that refers to dated camps comes off.
4. **Kids classes:** remove the "No-School Day Camp" card. Same reason as the home card: Josh removed that offer pending the client. The Summer Camp and Birthday cards stay and keep matching heights.
5. **`/registered-for-summer-fun-competition/`** (a 2024 fundraiser thank-you page, and the Square product says "event has ended"): 301 it to `/competitions/` in `vercel.json` (both slash forms). Remove the page and drop it from `source/pages.json`-driven tests, with a comment.
6. **Sweep:** search the built site for any other past-dated event content (2024, 2025, and 2026 dates before today) and list it in the report. Fix it the same way only if it's clearly event registration. Otherwise list it and leave it.

## Keep unchanged
- "Parkour currently unavailable" stays (the client is being asked).
- The `/registered-for-*` thank-you pages other than Summer Fun stay as they are (noindex), for when registration returns.
- The Central Forms wiring for the remaining forms, the Square links on unaffected pages, and journey tracking (`lead_form_success` must fire for the new waitlist forms too).

## Done means
- Side-by-side screenshots at 1440 and 390 of WNL, competitions, summer camps and kids classes.
- No horizontal overflow, no clipped buttons.
- Each new waitlist form submits on the `cursor/astro-rebuild` preview after merge. Claude checks that, using the support@ test address only.
- `vitest`, `astro build` and `scripts/qa/paragraphs.mjs` pass. Add IGNORE entries for the removed dated sentences, each with a one-line reason.
- Report: a table of items 1–6, the sweep list, preview links, and the model used.
