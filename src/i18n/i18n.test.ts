import { ARTICLE_IDS, ARTICLES, isArticleId, siteName, SOURCES } from './articles';
import ar from './ar';
import en from './en';
import fr from './fr';
import { formatDecimal, formatNumber, pluralCategory } from './plural';

type Tree = Record<string, unknown>;

/** Every leaf path with its value; arrays are walked by index so lengths must match too. */
function leaves(tree: unknown, prefix = ''): [string, unknown][] {
  if (tree === null || typeof tree !== 'object') return [[prefix, tree]];
  return Object.entries(tree as Tree).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
}

describe('translations', () => {
  const enPaths = leaves(en).map(([path]) => path);

  it.each([
    ['fr', fr],
    ['ar', ar],
  ])('%s has exactly the same strings, lists and functions as English', (_, messages) => {
    const paths = leaves(messages);
    expect(paths.map(([path]) => path)).toEqual(enPaths);
    const enTypes = leaves(en).map(([, v]) => typeof v);
    expect(paths.map(([, v]) => typeof v)).toEqual(enTypes);
  });

  it.each([
    ['en', en],
    ['fr', fr],
    ['ar', ar],
  ])('%s has no empty text (except the deliberately blank "other" plan trigger)', (_, messages) => {
    const empty = leaves(messages)
      .filter(([path, v]) => typeof v === 'string' && v.trim() === '' && path !== 'plan.fromTrigger.other')
      .map(([path]) => path);
    expect(empty).toEqual([]);
  });

  it('has an article text for every article in the library', () => {
    for (const id of ARTICLE_IDS) {
      expect(ARTICLES[id]).toBeDefined();
      expect(en.learn.articles[id].sections.length).toBeGreaterThan(0);
    }
    expect(isArticleId('lungs')).toBe(true);
    expect(isArticleId('../settings')).toBe(false);
    expect(isArticleId(undefined)).toBe(false);
  });
});

describe('formatDecimal', () => {
  it('shows at most one decimal, with a comma in French', () => {
    expect(formatDecimal(4.06, 'en')).toBe('4.1');
    expect(formatDecimal(4.06, 'fr')).toBe('4,1');
    expect(formatDecimal(4, 'ar')).toBe('4');
  });
});

describe('formatNumber', () => {
  it('groups thousands in Latin digits for every language', () => {
    expect(formatNumber(999, 'en')).toBe('999');
    expect(formatNumber(1284, 'en')).toBe('1,284');
    expect(formatNumber(9_627_000, 'ar')).toBe('9,627,000');
    expect(formatNumber(1284, 'fr')).toBe('1\u202F284');
    expect(formatNumber(-1500.4, 'en')).toBe('-1,500');
  });

  it('puts the formatted count into plural strings', () => {
    expect(en.community.charsLeft(1)).toBe('1 character left');
    expect(en.today.cravingsBeaten(1)).toBe('craving beaten');
    expect(ar.community.charsLeft(0)).toBe('لم يتبقَّ أي حرف');
    expect(en.journey.pointsWeek(1270)).toBe('1,270 this week');
    expect(ar.journey.bestWeek(1)).toBe('أفضل أسبوع: رغبة واحدة تجاوزتها');
    expect(ar.journey.leagueRank(2, 2)).toContain('آخر أسبوعين');
  });
});

describe('plurals', () => {
  it('follows CLDR rules for Arabic', () => {
    expect([0, 1, 2, 3, 10, 11, 99, 100, 102, 103].map((n) => pluralCategory('ar', n))).toEqual([
      'zero',
      'one',
      'two',
      'few',
      'few',
      'many',
      'many',
      'other',
      'other',
      'few',
    ]);
  });

  it('treats 0 and 1 as singular in French but not in English', () => {
    expect(pluralCategory('fr', 0)).toBe('one');
    expect(pluralCategory('en', 0)).toBe('other');
    expect(fr.progress.smokeFreeDays(0)).toMatch(/^0 jour sans/);
    expect(en.progress.smokeFreeDays(1)).toMatch(/^1 smoke-free day in total/);
  });

  it('uses the Arabic dual and the right counted form', () => {
    expect(ar.memory.moves(2)).toBe('حركتان');
    expect(ar.memory.moves(5)).toBe('5 حركات');
    expect(ar.memory.moves(12)).toBe('12 حركة');
  });
});

describe('plan sentences', () => {
  // The member's words are wrapped in invisible direction isolates; compare the visible text.
  const plain = (text: string) => text.replace(/[⁨⁩]/g, '');

  it('reads naturally in English', () => {
    expect(plain(en.plan.sentence('I drink coffee or tea', 'Walk for 2 minutes'))).toBe(
      'If I drink coffee or tea, then I walk for 2 minutes.',
    );
  });

  it('elides "je" and "si" in French, and does not double "je"', () => {
    expect(plain(fr.plan.sentence('Je finis un repas', 'Bois un verre d’eau'))).toBe('Si je finis un repas, alors je bois un verre d’eau.');
    expect(plain(fr.plan.sentence('Il pleut', 'Appelle ma sœur'))).toBe('S’il pleut, alors j’appelle ma sœur.');
    expect(plain(fr.plan.sentence('Je me réveille', 'Je marche'))).toBe('Si je me réveille, alors je marche.');
  });

  it('builds an Arabic "if… then" sentence', () => {
    expect(plain(ar.plan.sentence('استيقظت', 'أشرب كوبًا من الماء'))).toBe('إذا استيقظت، فأشرب كوبًا من الماء.');
  });
});

describe('sources', () => {
  it('shows the site, not the full address', () => {
    expect(siteName(SOURCES.nci.url!)).toBe('cancer.gov');
    expect(siteName('https://www.nhs.uk/better-health/quit-smoking/')).toBe('nhs.uk');
    expect(siteName('https://cdc.gov?x=1')).toBe('cdc.gov');
  });

  it('names every source in every language', () => {
    for (const messages of [en, fr, ar]) {
      for (const id of Object.keys(SOURCES) as (keyof typeof SOURCES)[]) expect(messages.learn.sourceNames[id]).toBeTruthy();
    }
  });
});

describe('plan sentences with mixed scripts', () => {
  const strip = (s: string) => s.replace(/[⁨⁩]/g, '');

  it('does not double "I" in English', () => {
    expect(strip(en.plan.sentence('I get in the car', "I'll call my sister"))).toBe('If I get in the car, then I call my sister.');
    expect(strip(en.plan.sentence('coffee', 'walk 2 minutes'))).toBe('If coffee, then I walk 2 minutes.');
  });

  it('isolates the member’s words and keeps "ف" off a Latin word in Arabic', () => {
    const s = ar.plan.sentence('I finish work', 'call my sister');
    expect(s).toContain('⁨I finish work⁩');
    expect(strip(s)).toBe('إذا I finish work، فـ call my sister.');
    expect(strip(ar.plan.sentence('أشرب القهوة', 'أمشي دقيقتين'))).toBe('إذا أشرب القهوة، فأمشي دقيقتين.');
  });
});
