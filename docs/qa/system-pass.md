# System pass: put the rebuild on the Fluid Frame Astro system

Josh, 11 Nov 2026: **the Astro system always wins over the old site's code.** The live site (built 2023) was designed and checked by people Josh trusts, so we keep that human work: the words, photos, brand colours and fonts, the look and feel of each section, page order and URLs. Its code and structure are years behind the current system, so structure comes from the rules, never from the old site.

The rules are in `docs/sop/astro-full-build-rules.md`, a copy of ff-architect PR #644. Read Rule 0.4 (rebuilds) first.

## What changes on every page (all 23)

1. **One content width (Rule 4).** Define `--content-max: 900px` and `--content-pad: 24px` once. Every readable section uses them. Remove the copied live widths (1,070–1,150px, the per-page `width: min(...)` rules in `src/styles/batch2.css`, `batch3.css` and later files). Full-width bands are fine for backgrounds (hero, colour bands, footer); the content inside stays at 900px.
2. **Body copy reads like an article (Rule 4.1).** A body section (an H2 with paragraphs) sits on the page background, never inside a bordered, rounded or shadowed box. Cards are only for short scannable items. Where the live design boxes long copy (for example the coach bios), keep its colours and frame style for short elements, but flag every place where you took copy out of a box, so Josh can see them.
3. **Images beside the words; reviews full width, one at a time (Rule 4.2).** Two-column photo sections alternate sides, match heights and stack on phones (text first). No full-width body photos. Reviews are their own band at the content width, one at a time, never two or three grouped.
4. **Related and final CTA bands (Rule 4.3).** The final CTA is its own strong-colour band, the last section before the footer.
5. **Footer (Rule 4.4).** Rebuild the shared footer to Rule 4.4 and the Header & Footer SOP's information contract: 3–4 equal columns with headings at 1440px (logo or name, a short description, the service and page links, the labelled phone with digits, address, hours if confirmed, service area), a copyright row, and stacked columns on phones. Use the facts already on the site; invent nothing.
6. **Header, mobile bar, phone, hero, trust bar, CTAs (Rules 5–10).** Check each against its rule and fix what doesn't meet it. The header is two bars with a hamburger on mobile; the hero is a real first `<img>`; there is one H1; the trust bar goes directly under the hero; all phone numbers are the NAP; schedulers and maps load on first interaction. Report rule by rule what you changed and what already passed.
7. **Typography (Rule 4).** No all-caps headings and no italics for emphasis. Use AP-style title case on H1–H3, built from the existing words: change the case only, never the words. Keep the site's existing fonts and colours (Josh's call per site).

## What must not change

- **Words.** Every heading, paragraph, list item, button label and link text stays exactly as it is, except for heading case (point 7).
- **Photos, brand colours, fonts, page order, URLs.**
- **Forms.** Keep the Central Forms wiring unchanged: field names, siteKey, formKey, retry id, thank-you redirects and host gate. The forms were tested end to end on 11 Nov. Their look may follow the new layout.
- **The thank-you pages' Square pay links.**

## How it is checked

- **Content:** run `scripts/qa/layout-map.mjs` on the preview and `compare-layout.mjs` against `docs/qa/layout-map/live`. Only lines about **missing** headings, text, images, buttons or form fields count; they must be zero. Layout lines (positions, widths, spacing, band runs) are expected now and are not targets.
- **Rules:** every page meets Rules 4–10. Measure the content edges at 1440: every section shares the same left and right edges (±2px), 900px wide.
- **Look:** take side-by-side screenshots of each page against live at 1920, 1280 and 390, after scrolling so lazy images load. It should read as the same business and the same design language: colours, fonts, photos and section feel. Only the structure has moved onto the system.
- Report rule by rule, list every place where the look changed because of a rule, and include before and after screenshots of a few key pages.
