import type { Lang } from '@/i18n/plural';

/**
 * "25 Sep" or "25 Sep 2025": a short date in the app's language, with Latin digits as everywhere
 * else in the app (some devices default Arabic to Arabic-Indic digits). The year shows only when it
 * isn't the current one, unless `year` asks for it.
 */
export function formatShortDate(at: number, lang: Lang, { year, now = Date.now() }: { year?: boolean; now?: number } = {}): string {
  const date = new Date(at);
  const showYear = year ?? date.getFullYear() !== new Date(now).getFullYear();
  try {
    return date.toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : lang, { day: 'numeric', month: 'short', ...(showYear ? { year: 'numeric' } : {}) });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}
