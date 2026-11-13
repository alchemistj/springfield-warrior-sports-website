import { collectClickToCall, collectContactClick } from "./collect";
import { isContactHref, isTelHref } from "./contactHref";
import { ctaLocationFor } from "./ctaLocation";

/**
 * One journey event per tel: activation, and one contact_click per link to
 * /contact/. The listener does not change the link.
 */
export function bindJourneyInteractions(): () => void {
  if (typeof document === "undefined") return () => undefined;

  const onClick = (event: Event) => {
    const raw = event.target;
    const target =
      raw && typeof (raw as Element).closest === "function"
        ? (raw as Element)
        : ((raw as Node | null)?.parentElement ?? null);
    if (!target || typeof target.closest !== "function") return;
    const link = target.closest("a");
    if (!link) return;
    const href = link.getAttribute("href")?.trim() || "";
    if (isTelHref(href)) {
      void collectClickToCall({ ctaLocation: ctaLocationFor(link) });
      return;
    }
    if (isContactHref(href)) {
      void collectContactClick({ ctaLocation: ctaLocationFor(link) });
    }
  };

  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}
