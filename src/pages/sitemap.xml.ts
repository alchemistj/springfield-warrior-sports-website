import type { APIRoute } from "astro";
import { indexedRoutes, canonicalUrl } from "../lib/routes";

export const GET: APIRoute = () => {
  const urls = indexedRoutes
    .map(
      (route) => `  <url><loc>${canonicalUrl(route.path)}</loc><priority>${route.priority.toFixed(1)}</priority></url>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
