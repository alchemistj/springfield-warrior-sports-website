import { site, SITE_URL } from "../data/site";
import { canonicalUrl, type Route } from "./routes";

export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["SportsActivityLocation", "LocalBusiness"],
    name: site.name,
    url: SITE_URL,
    telephone: site.phone.e164,
    email: site.email,
    image: `${SITE_URL}/og.jpg`,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    openingHoursSpecification: site.hours.map((row) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: row.days,
      opens: row.opens,
      closes: row.closes,
    })),
  };
}

export function breadcrumbSchema(route: Route) {
  const items = [
    { "@type": "ListItem", position: 1, name: "Home", item: canonicalUrl("/") },
  ];
  if (route.path !== "/") {
    items.push({ "@type": "ListItem", position: 2, name: route.name, item: canonicalUrl(route.path) });
  }
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items };
}
