# Review 2: polish pass (build at b10c9b7)

Reviewer: Claude. Josh approved this pass on 9 Nov 2026. Side-by-side images are in `docs/qa/review-2-input/` (live site on the left, build on the right). They come from a scrolled screenshot, so every lazy image is loaded.

Review 1 is mostly fixed. Leave the header, logo, bullet bar, trust bar, the blue card band, testimonials, footer, forms logic, redirects, routes and address as they are. Fix only these three things:

1. **Home hero.**
   - Make it the same height as the live hero at 1440 px (about 520 px from the bottom of the header to the black bullet bar). It's about 30% shorter now.
   - Match the live text sizes: "STRONGER" and "ONE OBSTACLE AT A TIME!" are clearly bigger on the live site. Keep the text left-aligned, at the live position.
   - On mobile the white and red text sits on a busy photo with no shading, so it's hard to read. Add the live site's dark overlay (sample it from `source/pages/home/rendered.html`) so the text meets WCAG AA.
   - Same check on every other page's hero: the height and text size should match the live page.
2. **Home cards (blue band).**
   - Each card's photo should fill the card's full height on the left, at about the live width (roughly a third of the card), with `object-fit: cover`. Right now they're small fixed thumbnails.
   - Check each card's photo against the live screenshot. Parkour looks wrong: the live card shows a man vaulting a green box. Check Homeschool and Personal Training too. Use the image the live card uses (`source/pages/home/meta.json` → `imgs`, in order).
   - Mobile: the photo goes above the text at full card width, as on the live site.
3. **Type scale and spacing on desktop.**
   - Body text, section headings, form labels and inputs are all a step smaller and tighter than the live site at 1440 px. Match the live sizes, line heights and the vertical spacing between form fields. Pull the values from `rendered.html`, not by eye.
   - Contact page and the schedule-birthday-party form: match the live field height and gaps.

Self-check: rebuild the side-by-side images for every page into `docs/qa/review-3/`, the same way, scrolling the page first so lazy images load. Add a "Review 2 fixes" table to `docs/qa/build-report.md`.
