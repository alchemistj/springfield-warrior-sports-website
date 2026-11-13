import { pages, type PageContent } from "../data/content";
import { SITE_URL } from "../data/site";

export interface Route {
  key: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  name: string;
  index: boolean;
  robots: string;
  photoHero: boolean;
  priority: number;
}

export const routes: readonly Route[] = pages.map((page) => ({
  key: page.slug,
  path: page.path,
  title: page.title,
  description: page.description,
  h1: page.h1,
  name: page.h1,
  index: page.index,
  robots: page.robots,
  photoHero: page.photoHero,
  priority: page.path === "/" ? 1 : page.index ? 0.7 : 0.1,
}));

export const indexedRoutes = routes.filter((route) => route.index);

export function routeByPath(path: string): Route | undefined {
  return routes.find((route) => route.path === path);
}

export function canonicalUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export type { PageContent };
