/** Lower-cases the first letter for use mid-sentence, but keeps "I", "I'm" and acronyms. */
/**
 * Text written by the member inside a line of interface text. Unicode isolation marks stop an Arabic
 * name or phrase in English text (or a Latin one in Arabic) from pulling neighbouring words and numbers
 * into its own direction: without them "Milestone · نور · 59 min ago" displays as "Milestone · 59 · نور / min ago".
 */
export function isolate(text: string): string {
  return `\u2068${text}\u2069`;
}

export function lowerFirst(s: string): string {
  const t = s.trim().replace(/\.$/, '');
  if (/^(I\b|I[’']|[A-Z]{2})/.test(t)) return t;
  return t.charAt(0).toLowerCase() + t.slice(1);
}

/**
 * The reading direction a piece of user-written text needs, from its first strong character
 * (letters; emoji, digits and punctuation are skipped), like the browser's dir="auto".
 * Undefined when the text has no letters at all (e.g. only emoji): keep the interface's direction.
 */
export function contentDirection(text: string): 'rtl' | 'ltr' | undefined {
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    // Hebrew, Arabic, Syriac, Thaana, N'Ko, Arabic supplements and presentation forms.
    if ((c >= 0x0590 && c <= 0x08ff) || (c >= 0xfb1d && c <= 0xfdff) || (c >= 0xfe70 && c <= 0xfefc)) return 'rtl';
    if (/\p{L}/u.test(ch)) return 'ltr';
  }
  return undefined;
}
