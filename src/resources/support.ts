/**
 * Verified support lines, by country.
 *
 * RULES FOR EDITING (this file is the admin surface; there is no backend):
 * - Only add a number you have checked on the official source itself (government, health
 *   service or the line's own site). Never copy a number from news, blogs or directories.
 * - Record that source URL and the date you checked it in `verifiedAt` (YYYY-MM-DD).
 * - Re-check every entry at least once a year; numbers change.
 * - Countries without a verified entry fall back to the WHO page and "your local emergency
 *   number", which is safe everywhere.
 * Tests in support.test.ts enforce the required fields.
 */

export type ResourceKind = 'quitline' | 'crisis' | 'urgent';
export type ResourceNote = 'free' | 'free247' | 'freeCoaching' | 'callText247';

export interface SupportResource {
  kind: ResourceKind;
  name: string;
  /** Digits as dialled (used for the tel: link). */
  phone?: string;
  /** How the number is displayed. */
  phoneLabel?: string;
  url?: string;
  /** Short fact stated on the official source; the wording lives in the translations (`help.notes`). */
  note?: ResourceNote;
  /** Official page the details were checked against. */
  source: string;
  verifiedAt: string;
}

export interface CountrySupport {
  /** ISO 3166-1 alpha-2. */
  country: string;
  /** Country name in each app language. */
  names: { en: string; fr: string; ar: string };
  resources: SupportResource[];
}

export const SUPPORT: CountrySupport[] = [
  {
    country: 'FR',
    names: { en: 'France', fr: 'France', ar: 'فرنسا' },
    resources: [
      {
        kind: 'quitline',
        name: 'Tabac Info Service',
        phone: '3989',
        phoneLabel: '39 89',
        url: 'https://www.tabac-info-service.fr/',
        source: 'https://www.tabac-info-service.fr/',
        verifiedAt: '2026-10-02',
      },
      {
        kind: 'crisis',
        name: '3114 — Numéro national de prévention du suicide',
        phone: '3114',
        phoneLabel: '3114',
        url: 'https://3114.fr/',
        note: 'free247',
        source: 'https://3114.fr/',
        verifiedAt: '2026-10-02',
      },
      {
        kind: 'urgent',
        name: 'SAMU — urgence médicale',
        phone: '15',
        phoneLabel: '15',
        note: 'free247',
        source: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F33954',
        verifiedAt: '2026-10-02',
      },
      {
        kind: 'urgent',
        name: 'Numéro d’urgence européen',
        phone: '112',
        phoneLabel: '112',
        note: 'free247',
        source: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F33954',
        verifiedAt: '2026-10-02',
      },
    ],
  },
  {
    country: 'US',
    names: { en: 'United States', fr: 'États-Unis', ar: 'الولايات المتحدة' },
    resources: [
      {
        kind: 'quitline',
        name: '1-800-QUIT-NOW',
        phone: '18007848669',
        phoneLabel: '1-800-784-8669',
        note: 'freeCoaching',
        source: 'https://www.cdc.gov/tobacco/campaign/tips/quit-smoking/quitline/index.html',
        verifiedAt: '2026-10-02',
      },
      {
        kind: 'crisis',
        name: '988 Suicide & Crisis Lifeline',
        phone: '988',
        phoneLabel: '988',
        url: 'https://988lifeline.org/',
        note: 'callText247',
        source: 'https://988lifeline.org/',
        verifiedAt: '2026-10-02',
      },
    ],
  },
  {
    country: 'GB',
    names: { en: 'United Kingdom', fr: 'Royaume-Uni', ar: 'المملكة المتحدة' },
    resources: [
      {
        kind: 'quitline',
        name: 'NHS Stop Smoking Services',
        url: 'https://www.nhs.uk/better-health/quit-smoking/find-your-local-stop-smoking-service/',
        source: 'https://www.nhs.uk/better-health/quit-smoking/find-your-local-stop-smoking-service/',
        verifiedAt: '2026-10-02',
      },
      {
        kind: 'crisis',
        name: 'Samaritans',
        phone: '116123',
        phoneLabel: '116 123',
        note: 'free',
        source: 'https://www.nhs.uk/nhs-services/mental-health-services/where-to-get-urgent-help-for-mental-health/',
        verifiedAt: '2026-10-02',
      },
      {
        kind: 'urgent',
        name: '999 — life at risk',
        phone: '999',
        phoneLabel: '999',
        source: 'https://www.nhs.uk/nhs-services/mental-health-services/where-to-get-urgent-help-for-mental-health/',
        verifiedAt: '2026-10-02',
      },
      {
        kind: 'urgent',
        name: 'NHS 111 (mental health option)',
        phone: '111',
        phoneLabel: '111',
        source: 'https://www.nhs.uk/nhs-services/mental-health-services/where-to-get-urgent-help-for-mental-health/',
        verifiedAt: '2026-10-02',
      },
    ],
  },
];

/** Shown for every country: safe, verified, never a guessed number. */
export const WORLDWIDE: SupportResource = {
  kind: 'quitline',
  name: 'WHO — Tobacco',
  url: 'https://www.who.int/health-topics/tobacco',
  source: 'https://www.who.int/health-topics/tobacco',
  verifiedAt: '2026-10-02',
};

export function supportFor(country: string | undefined): CountrySupport | undefined {
  return country ? SUPPORT.find((c) => c.country === country.toUpperCase()) : undefined;
}
