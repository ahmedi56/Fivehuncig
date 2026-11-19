export type Lang = 'en' | 'fr' | 'ar';

/** CLDR plural forms. `other` is required; a missing form falls back to `other`. `#` is replaced by the number. */
export interface PluralForms {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

type Category = keyof PluralForms;

/**
 * CLDR cardinal rules for whole numbers. Written out by hand because Hermes does not
 * ship `Intl.PluralRules` on every platform.
 */
export function pluralCategory(lang: Lang, n: number): Category {
  const i = Math.floor(Math.abs(n));
  if (lang === 'fr') return i === 0 || i === 1 ? 'one' : 'other';
  if (lang === 'ar') {
    if (i === 0) return 'zero';
    if (i === 1) return 'one';
    if (i === 2) return 'two';
    const mod100 = i % 100;
    if (mod100 >= 3 && mod100 <= 10) return 'few';
    if (mod100 >= 11 && mod100 <= 99) return 'many';
    return 'other';
  }
  return i === 1 ? 'one' : 'other';
}

/** Thousands separator per language (Latin digits throughout, as in the rest of the app). */
const GROUP: Record<Lang, string> = { en: ',', fr: '\u202F', ar: ',' };

/**
 * Whole numbers with a thousands separator: 1,284 (en, ar) and 1 284 (fr, narrow no-break space).
 * Hand-written for the same reason as the plural rules: Intl is not complete on every Hermes build.
 */
export function formatNumber(n: number, lang: Lang): string {
  const negative = n < 0;
  const digits = String(Math.round(Math.abs(n)));
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP[lang]);
  return negative ? `-${grouped}` : grouped;
}

/** One decimal at most, with the language's decimal mark: "4.1", "4,1", "4". */
export function formatDecimal(n: number, lang: Lang): string {
  const text = String(Math.round(n * 10) / 10);
  return lang === 'fr' ? text.replace('.', ',') : text;
}

export function plural(lang: Lang, n: number, forms: PluralForms): string {
  return (forms[pluralCategory(lang, n)] ?? forms.other).replace('#', formatNumber(n, lang));
}
