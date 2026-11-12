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

/**
 * Gravity Forms chrome that text.txt glued into the page. These lines are not page copy.
 * The copy-parity test ignores them, and the page must not print them outside the form.
 */
export function isFormDumpLine(line) {
  const t = collapse(line);
  if (!t) return false;
  if (/indicates required fields/i.test(t)) return true;
  if (/\(required\)/i.test(t)) return true;
  if (/first and last name\s*\*/i.test(t)) return true;
  if (/^name first last email\s*\*$/i.test(t)) return true;
  if (/^add more participant$/i.test(t)) return true;
  if (/^(submit and continue to payment)$/i.test(t)) return true;
  if (/\b(csna|wnl)\b/i.test(t) && /form$/i.test(t) && t.length < 80) return true;
  if (/\*\s*$/.test(t)) return true;
  if (/^would you like to discuss any of these\??$/i.test(t)) return true;
  if (/^anything else\??$/i.test(t)) return true;
  if (/^(nerf battle party|laser tag party|private party|pizza party)$/i.test(t)) return true;
  if (/^(first|last|name|email|phone)$/i.test(t)) return true;
  return false;
}

function isBoundary(line) {
  const letters = line.replace(/[^A-Za-z]/g, "");
  // All-caps lines are headings. Rule 4 changes their case, so a trailing ! or ? does not
  // make the line a sentence the built page must repeat in the original capitals.
  const heading = letters.length > 3 && letters === letters.toUpperCase() && line.length <= 120;
  return heading || /^(submit|notify me)$/i.test(line) || isFormDumpLine(line);
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
