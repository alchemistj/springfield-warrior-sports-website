const images = import.meta.glob("../../assets/media/*.{webp,jpeg,jpg,png}", {
  eager: true,
  import: "default",
}) as Record<string, { src: string; width: number; height: number } | string>;

export function media(file: string): { src: string; width: number; height: number } {
  const found = images[`../../assets/${file}`];
  if (!found) return { src: "", width: 1200, height: 800 };
  if (typeof found === "string") return { src: found, width: 1200, height: 800 };
  return found;
}
