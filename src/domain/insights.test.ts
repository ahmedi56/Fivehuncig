import { suggestArticle } from '@/content/suggest';

import { cravingTimeInsight, dayPartOf, MIN_EVENTS_FOR_INSIGHT } from './insights';
import { DAY, HOUR } from './time';
import type { CravingEvent, Profile } from './types';

const NOW = new Date(2026, 9, 2, 23, 0).getTime();
const at = (daysAgo: number, hour: number) => {
  const d = new Date(NOW - daysAgo * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
};
const craving = (t: number): CravingEvent => ({ id: String(t), at: t, beaten: true });

describe('craving-time insight', () => {
  it('maps hours to parts of the day', () => {
    expect([6, 13, 19, 23, 3].map((h) => dayPartOf(at(0, h)))).toEqual(['morning', 'afternoon', 'evening', 'night', 'night']);
  });

  it('says nothing with too little data', () => {
    const few = Array.from({ length: MIN_EVENTS_FOR_INSIGHT - 1 }, (_, i) => craving(at(i, 19)));
    expect(cravingTimeInsight(few, [], NOW)).toBeUndefined();
  });

  it('reports the part of the day that clearly stands out', () => {
    const events = [19, 20, 18, 21, 19, 9, 14].map((h, i) => craving(at(i, h)));
    expect(cravingTimeInsight(events, [], NOW)).toEqual({ total: 7, part: 'evening', count: 5 });
  });

  it('says nothing when no part of the day stands out', () => {
    const events = [8, 9, 13, 14, 19, 20, 23, 2].map((h, i) => craving(at(i, h)));
    expect(cravingTimeInsight(events, [], NOW)).toBeUndefined();
  });

  it('ignores events older than 30 days', () => {
    const old = [19, 19, 19, 19, 19, 19].map((h, i) => craving(at(40 + i, h)));
    expect(cravingTimeInsight(old, [], NOW)).toBeUndefined();
  });
});

describe('suggested article', () => {
  const profile = (over: Partial<Profile>): Profile => ({
    cigsPerDay: 15,
    pricePerPack: 10,
    cigsPerPack: 20,
    currency: '$',
    wakeHours: 16,
    mode: 'quit',
    startedAt: NOW - 30 * DAY,
    weeklyStep: 0.1,
    ...over,
  });

  it('fits the member’s stage', () => {
    expect(suggestArticle(profile({ quitAt: NOW - 3 * DAY }), [], NOW)).toBe('withdrawal');
    expect(suggestArticle(profile({ quitAt: NOW - 3 * DAY }), [{ id: 'a', at: NOW - 2 * HOUR }], NOW)).toBe('slips');
    expect(suggestArticle(profile({ quitAt: NOW - 20 * DAY }), [], NOW)).toBe('when-you-stop');
    expect(suggestArticle(profile({ mode: 'cutdown', cutdownStartedAt: NOW - DAY }), [], NOW)).toBe('cut-down');
    expect(suggestArticle(profile({ mode: 'watch' }), [], NOW)).toBe('nicotine-brain');
  });
});
