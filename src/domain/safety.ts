/**
 * Crisis detection for the support chat. Runs on the phone (works offline) and again on the
 * server before any AI call. A match never goes to the model: the member gets a fixed,
 * reviewed message with verified resources instead.
 *
 * Deliberately broad. A false positive costs one extra safety card; a miss could cost far more.
 */

export type SafetyKind = 'self-harm' | 'medical-emergency';

const SELF_HARM = [
  // English
  'suicide',
  'suicidal',
  'kill myself',
  'end my life',
  'want to die',
  'wanna die',
  'hurt myself',
  'harm myself',
  'self harm',
  'self-harm',
  'no reason to live',
  'better off dead',
  // French
  'me tuer',
  'me suicider',
  'mettre fin a mes jours',
  'mettre fin a ma vie',
  'envie de mourir',
  'veux mourir',
  'me faire du mal',
  'automutilation',
  'plus envie de vivre',
  // Arabic (normalized: no diacritics, plain alef)
  'انتحار',
  'انتحر',
  'اقتل نفسي',
  'انهي حياتي',
  'اريد ان اموت',
  'بدي اموت',
  'نحب نموت',
  'اوذي نفسي',
  'ايذاء النفس',
];

const MEDICAL = [
  // English
  'chest pain',
  'pain in my chest',
  "can't breathe",
  'cannot breathe',
  'cant breathe',
  'trouble breathing',
  'passed out',
  'fainted',
  'overdose',
  'heart attack',
  'stroke',
  'seizure',
  // French
  'douleur thoracique',
  'douleur a la poitrine',
  'mal a la poitrine',
  "n'arrive pas a respirer",
  'du mal a respirer',
  'je m evanouis',
  "je me suis evanoui",
  'surdose',
  'crise cardiaque',
  'infarctus',
  'avc',
  'convulsion',
  // Arabic (normalized)
  'الم في الصدر',
  'لا استطيع التنفس',
  'ما نقدرش نتنفس',
  'صعوبه في التنفس',
  'اغمي علي',
  'جرعه زائده',
  'نوبه قلبيه',
  'جلطه',
  'سكته',
  'تشنج',
];

/** Lower-case, strip Latin accents and Arabic diacritics, unify alef/ta-marbuta, collapse spaces. */
export function normalizeForSafety(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    // Latin accents (U+0300-036F); Arabic harakat, hamza marks, superscript alef and tatweel.
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u064b-\u0655\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ');
}

const SELF_HARM_N = SELF_HARM.map(normalizeForSafety);
const MEDICAL_N = MEDICAL.map(normalizeForSafety);

/** Whole-word-ish match for short Latin keywords ("avc", "stroke") to avoid matching inside other words. */
function contains(haystack: string, needle: string): boolean {
  if (!/^[a-z' -]+$/.test(needle)) return haystack.includes(needle);
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z])${escaped}($|[^a-z])`).test(haystack);
}

export function detectCrisis(text: string): SafetyKind | undefined {
  const t = normalizeForSafety(text);
  if (SELF_HARM_N.some((k) => contains(t, k))) return 'self-harm';
  if (MEDICAL_N.some((k) => contains(t, k))) return 'medical-emergency';
  return undefined;
}
