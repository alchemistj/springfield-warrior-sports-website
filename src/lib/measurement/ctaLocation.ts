export const CTA_LOCATIONS = [
  "header",
  "mobile_menu",
  "hero",
  "cta_band",
  "main",
  "footer",
  "sticky_bar",
] as const;

export type CtaLocation = (typeof CTA_LOCATIONS)[number];

export function isCtaLocation(value: string | null | undefined): value is CtaLocation {
  return (CTA_LOCATIONS as readonly string[]).includes(value ?? "");
}

function markedLocation(link: Element): string {
  return link.getAttribute("data-cta-location")?.trim() || "";
}

/**
 * Where a phone or contact link sits. The trust bar counts as hero.
 * The hamburger panel is mobile_menu; the same nav on a wide screen is header.
 */
export function ctaLocationFor(link: Element): CtaLocation | null {
  const marked = markedLocation(link);
  if (isCtaLocation(marked)) return marked;
  if (link.closest(".call-bar")) return "sticky_bar";
  if (link.closest(".site-footer")) return "footer";
  if (link.closest(".final-cta, .b4-cta")) return "cta_band";
  if (link.closest(".trust-bar, .hero, .hero-text")) return "hero";
  if (link.closest(".nav-links")) {
    const menuOnly = link.classList.contains("menu-only");
    const narrow =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 1023px)").matches;
    if (menuOnly || narrow) return "mobile_menu";
    return "header";
  }
  if (link.closest(".site-header")) return "header";
  if (link.closest("main, .section, .form-band")) return "main";
  return "main";
}
