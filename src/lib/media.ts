const images = import.meta.glob("../assets/media/*.{webp,jpeg,jpg,png}", {
  eager: true,
  import: "default",
}) as Record<string, { src: string; width: number; height: number }>;

export function media(file: string): { src: string; width: number; height: number } {
  const found = images[`../assets/${file}`];
  if (!found) throw new Error(`Missing media ${file}`);
  return found;
}
