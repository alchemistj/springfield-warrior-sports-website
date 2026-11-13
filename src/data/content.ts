import raw from "./content.json";

export interface Block {
  type: "p" | "h2" | "a";
  text: string;
  href?: string;
}

export interface ContentImage {
  file: string;
  alt: string;
  kind: "photo" | "logo";
}

export interface PageContent {
  slug: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  h1FromSource: boolean;
  index: boolean;
  robots: string;
  photoHero: boolean;
  heroFile: string | null;
  heroAlt: string;
  images: ContentImage[];
  logos: ContentImage[];
  formId: string | null;
  blocks: Block[];
}

export const pages: readonly PageContent[] = raw.pages as PageContent[];

export function pageBySlug(slug: string): PageContent {
  const page = pages.find((item) => item.slug === slug);
  if (!page) throw new Error(`Unknown page: ${slug}`);
  return page;
}

export function pageByPath(path: string): PageContent | undefined {
  return pages.find((item) => item.path === path);
}
