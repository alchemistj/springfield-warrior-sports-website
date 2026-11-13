const OWN_HOSTS = new Set(["springfieldwarriorsports.com", "www.springfieldwarriorsports.com"]);

/** True for a link whose path is /contact/, including a hash. Other hosts, tel, and sms are not. */
export function isContactHref(href: string | null | undefined): boolean {
  const trimmed = href?.trim() ?? "";
  if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) return false;
  if (/^(mailto|tel|sms):/i.test(trimmed)) return false;
  try {
    const absolute = trimmed.startsWith("/")
      ? new URL(trimmed, "https://www.springfieldwarriorsports.com")
      : new URL(trimmed);
    if (!trimmed.startsWith("/")) {
      const host = absolute.hostname.toLowerCase();
      if (!OWN_HOSTS.has(host)) return false;
    }
    const path = absolute.pathname.replace(/\/+$/, "") || "/";
    return path === "/contact";
  } catch {
    return false;
  }
}

export function isTelHref(href: string | null | undefined): boolean {
  return (href?.trim() ?? "").toLowerCase().startsWith("tel:");
}
