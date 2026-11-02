export const MAP_QUERY = "605 W. Plainview Road, Springfield, MO 65810";

export function mapEmbedUrl(): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`;
}
