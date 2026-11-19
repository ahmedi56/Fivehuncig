export interface ProfileForm {
  cigsPerDay: string;
  pricePerPack: string;
  cigsPerPack: string;
  currency: string;
  wakeHours: string;
}

export interface ParsedProfileForm {
  cigsPerDay: number;
  pricePerPack: number;
  cigsPerPack: number;
  currency: string;
  wakeHours: number;
}

/** Error codes; the messages live in the translations (`validation` in src/i18n). */
export type FormError = 'wholeNumber' | 'price' | 'hours';
export type FormErrors = Partial<Record<keyof ProfileForm, FormError>>;

/**
 * Arabic keyboards type Arabic-Indic digits (٠–٩, or ۰–۹ in Persian layouts), "٫" for the decimal
 * point and "٬" between thousands; French writes thousands with a space ("1 500").
 */
function westernDigits(value: string): string {
  return value
    .replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) & 0xf))
    .replace(/\u066B/g, '.')
    .replace(/\u066C/g, ',')
    .replace(/(\d)[\s\u00A0\u202F](?=\d{3}\b)/g, '$1');
}

function num(value: string): number {
  // Accept "1,500", "1 500", "1.5", "1,5" and "١٢٫٥"; reject anything that isn't a plain number.
  const cleaned = westernDigits(value.trim()).replace(/,(?=\d{3}\b)/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return NaN;
  return Number(cleaned);
}

export function validateProfileForm(form: ProfileForm):
  | { ok: true; value: ParsedProfileForm }
  | { ok: false; errors: FormErrors } {
  const errors: FormErrors = {};
  const cigsPerDay = num(form.cigsPerDay);
  const pricePerPack = form.pricePerPack.trim() === '' ? 0 : num(form.pricePerPack);
  const cigsPerPack = num(form.cigsPerPack);
  const wakeHours = num(form.wakeHours);
  const currency = form.currency.trim().slice(0, 4);

  if (!Number.isInteger(cigsPerDay) || cigsPerDay < 1 || cigsPerDay > 100)
    errors.cigsPerDay = 'wholeNumber';
  if (!Number.isFinite(pricePerPack) || pricePerPack < 0 || pricePerPack > 1_000_000)
    errors.pricePerPack = 'price';
  if (!Number.isInteger(cigsPerPack) || cigsPerPack < 1 || cigsPerPack > 100)
    errors.cigsPerPack = 'wholeNumber';
  if (!Number.isFinite(wakeHours) || wakeHours < 6 || wakeHours > 22)
    errors.wakeHours = 'hours';

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { cigsPerDay, pricePerPack, cigsPerPack, currency, wakeHours } };
}

/** Trims user text and limits its length; returns undefined if empty. */
export function cleanText(value: string, max = 140): string | undefined {
  const t = value.replace(/\s+/g, ' ').trim().slice(0, max);
  return t.length > 0 ? t : undefined;
}
