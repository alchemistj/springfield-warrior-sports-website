import type { APIRoute } from "astro";
import { site } from "../data/site";
import { indexedRoutes, canonicalUrl } from "../lib/routes";

export const GET: APIRoute = () => {
  const links = indexedRoutes.map((route) => `- ${route.title}: ${canonicalUrl(route.path)}`).join("\n");
  const body = `# ${site.name}

${site.name} is a ninja and parkour gym in Springfield, Missouri.

Phone: ${site.phone.display}
Email: ${site.email}
Address: ${site.address.oneLine}

## Pages

${links}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
