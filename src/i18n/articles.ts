import type { IconName } from '@/components/icons';

/**
 * Learn library: the language-independent part of each article (order, category, icon, sources).
 * The text of each article lives in the translations (`learn.articles` in en.ts / fr.ts / ar.ts).
 */

export type ArticleCategory = 'understand' | 'act' | 'products';

export const ARTICLE_IDS = [
  'one-cigarette',
  'lungs',
  'heart',
  'nicotine-brain',
  'cravings',
  'withdrawal',
  'when-you-stop',
  'cut-down',
  'routines',
  'stress',
  'social',
  'slips',
  'menthol',
  'rolling',
  'cigars',
  'shisha',
  'heated',
  'vapes',
  'smokeless',
] as const;

export type ArticleId = (typeof ARTICLE_IDS)[number];

export function isArticleId(value: unknown): value is ArticleId {
  return typeof value === 'string' && (ARTICLE_IDS as readonly string[]).includes(value);
}

export type SourceId = 'who' | 'cdc' | 'nhs' | 'nci' | 'fda' | 'cochrane';

/** Top-level pages only: deep links on health sites move often. Names are in `learn.sourceNames`. */
export const SOURCES: Record<SourceId, { url?: string }> = {
  who: { url: 'https://www.who.int/health-topics/tobacco' },
  cdc: { url: 'https://www.cdc.gov/tobacco/' },
  nhs: { url: 'https://www.nhs.uk/better-health/quit-smoking/' },
  nci: { url: 'https://www.cancer.gov/about-cancer/causes-prevention/risk/tobacco' },
  fda: { url: 'https://www.fda.gov/tobacco-products' },
  cochrane: {},
};

/** "cancer.gov" from a full address: the part people recognise, without the path. */
export function siteName(url: string): string {
  return url.replace(/^[a-z]+:\/\//i, '').replace(/^www\./i, '').split(/[/?#]/)[0];
}

export const ARTICLES: Record<ArticleId, { category: ArticleCategory; icon: IconName; sources: SourceId[] }> = {
  'one-cigarette': { category: 'understand', icon: 'cigarette', sources: ['cdc', 'nci'] },
  lungs: { category: 'understand', icon: 'lungs', sources: ['cdc', 'who'] },
  heart: { category: 'understand', icon: 'heart', sources: ['cdc', 'who'] },
  'nicotine-brain': { category: 'understand', icon: 'bolt', sources: ['cdc', 'nhs'] },
  cravings: { category: 'understand', icon: 'wave', sources: ['nhs'] },
  withdrawal: { category: 'understand', icon: 'cloud', sources: ['nhs', 'cdc'] },
  'when-you-stop': { category: 'understand', icon: 'sunrise', sources: ['who', 'cdc'] },
  'cut-down': { category: 'act', icon: 'today', sources: ['cochrane', 'cdc'] },
  routines: { category: 'act', icon: 'repeat', sources: ['nhs'] },
  stress: { category: 'act', icon: 'moon', sources: ['nhs'] },
  social: { category: 'act', icon: 'community', sources: ['nhs'] },
  slips: { category: 'act', icon: 'restart', sources: ['nhs'] },
  menthol: { category: 'products', icon: 'leaf', sources: ['fda', 'cdc'] },
  rolling: { category: 'products', icon: 'rolled', sources: ['nhs', 'who'] },
  cigars: { category: 'products', icon: 'cigar', sources: ['nci', 'fda'] },
  shisha: { category: 'products', icon: 'water', sources: ['who', 'cdc'] },
  heated: { category: 'products', icon: 'flame', sources: ['who', 'fda'] },
  vapes: { category: 'products', icon: 'vape', sources: ['nhs', 'who', 'cdc'] },
  smokeless: { category: 'products', icon: 'tin', sources: ['who', 'nci'] },
};

export const CATEGORY_ORDER: ArticleCategory[] = ['understand', 'act', 'products'];

/**
 * Review status of the text, per article. Nothing here has been reviewed yet: the English was
 * written from WHO/CDC/NHS/NCI/FDA public guidance; French and Arabic were translated in-house.
 * Update an entry only after the named review has actually happened (see docs/CONTENT_REVIEW.md).
 */
export type ReviewState = 'pending' | 'reviewed';

export interface ArticleReview {
  clinical: ReviewState;
  fr: ReviewState;
  ar: ReviewState;
}

export const REVIEW: Record<ArticleId, ArticleReview> = Object.fromEntries(
  ARTICLE_IDS.map((id) => [id, { clinical: 'pending', fr: 'pending', ar: 'pending' }]),
) as Record<ArticleId, ArticleReview>;
