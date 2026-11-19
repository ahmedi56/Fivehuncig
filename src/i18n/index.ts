import { getLocales } from 'expo-localization';

import { useAppStore } from '@/store/app-store';

import ar from './ar';
import en, { type Messages } from './en';
import fr from './fr';
import type { Lang } from './plural';

export type { Lang } from './plural';
export { formatDecimal, formatNumber } from './plural';
export type { Messages } from './en';

const MESSAGES: Record<Lang, Messages> = { en, fr, ar };

export const LANGUAGES: { lang: Lang; name: string }[] = [
  { lang: 'en', name: 'English' },
  { lang: 'fr', name: 'Français' },
  { lang: 'ar', name: 'العربية' },
];

export function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'fr' || value === 'ar';
}

/** The phone's preferred supported language, or English. */
export function deviceLanguage(): Lang {
  try {
    for (const locale of getLocales()) {
      if (isLang(locale.languageCode)) return locale.languageCode;
    }
  } catch {
    // No locale info (e.g. some test environments) — fall back to English.
  }
  return 'en';
}

/**
 * The phone's currency symbol, used as the onboarding default. Locales without a region
 * (e.g. plain "fr") have no currency, so use the first one that does. Empty beats a wrong guess.
 */
export function deviceCurrency(): string {
  try {
    const symbol = getLocales().find((l) => l.currencySymbol)?.currencySymbol;
    return symbol ? symbol.slice(0, 4) : '';
  } catch {
    return '';
  }
}

/** The phone's region (ISO alpha-2), e.g. "FR"; undefined when the locale has no region. */
export function deviceRegion(): string | undefined {
  try {
    return getLocales().find((l) => l.regionCode)?.regionCode ?? undefined;
  } catch {
    return undefined;
  }
}

export const isRTL = (lang: Lang) => lang === 'ar';

/** Current language: the user's choice, else the phone's language. */
export function useLang(): Lang {
  const chosen = useAppStore((s) => s.language);
  return chosen ?? deviceLanguage();
}

/** True when the current language is written right to left. */
export function useIsRTL(): boolean {
  return isRTL(useLang());
}

/** Typed strings for the current language. Re-renders when the language changes. */
export function useT(): Messages {
  return MESSAGES[useLang()];
}

/** For code outside React (notifications, exports). */
export function getLang(): Lang {
  return useAppStore.getState().language ?? deviceLanguage();
}

export function getT(): Messages {
  return MESSAGES[getLang()];
}

export function messagesFor(lang: Lang): Messages {
  return MESSAGES[lang];
}
