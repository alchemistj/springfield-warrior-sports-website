// Shared by the content prepare step and the copy-parity test.
// Header nav and the repeated footer tagline are chrome, not page copy.

export const NAV_LINES = [
  "CONTACT",
  "ABOUT",
  "SIGN OUR WAIVER",
  "ADULT CLASSES",
  "KID CLASSES",
  "COMPETITIONS",
  "BIRTHDAY PARTIES",
  "PERSONAL TRAINING",
  "SUMMER CAMPS",
];

const NAV = new Set(NAV_LINES);

export const FOOTER_TAGLINE =
  "Our accomplished and award winning Crew are here to help you find your strength and enjoy your workouts.";

export function collapse(text) {
  return text.replace(/\u00a0/g, " ").replace(/\u200b/g, "").replace(/\s+/g, " ").trim();
}

/** Page copy with the repeated header nav and footer chrome removed. */
export function mainContent(raw) {
  const lines = raw.replace(/\u00a0/g, " ").replace(/\u200b/g, "").split("\n");
  let i = 0;
  while (i < lines.length && (NAV.has(lines[i].trim()) || lines[i].trim() === "")) i += 1;
  const out = [];
  for (const line of lines.slice(i)) {
    if (line.trim() === FOOTER_TAGLINE) break;
    out.push(line);
  }
  return out.join("\n").trim();
}

function isBoundary(line) {
  const letters = line.replace(/[^A-Za-z]/g, "");
  const heading = letters.length > 3 && letters === letters.toUpperCase() && line.length <= 120 && !/[.!?]$/.test(line);
  return heading || /^(submit|notify me)$/i.test(line) || /^\*+\s*indicates required fields$/i.test(line);
}

function splitSentences(flat) {
  if (!flat) return [];
  return flat
    .split(/(?<=[.!?])\s+(?=[A-Z"“])/u)
    .map((s) => s.trim())
    .filter((s) => s.length >= 24 && /[.!?]$/.test(s));
}

/**
 * Sentences the built page must contain.
 * Headings, the submit button, and the required-fields note separate regions so a form's
 * field labels are not glued onto the next testimonial.
 */
export function sentences(text) {
  const regions = [];
  let buf = [];
  const flush = () => {
    if (buf.length) regions.push(buf.join(" "));
    buf = [];
  };
  for (const rawLine of text.split("\n")) {
    const line = collapse(rawLine);
    if (!line || isBoundary(line)) {
      flush();
      continue;
    }
    buf.push(line);
  }
  flush();
  return regions.flatMap(splitSentences);
}

export function decodeHtml(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

export function visibleText(html) {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/?(a|span|strong|em|b|i)\b[^>]*>/gi, "")
    .replace(/<[^>]+>/g, " ");
  return collapse(decodeHtml(stripped));
}
