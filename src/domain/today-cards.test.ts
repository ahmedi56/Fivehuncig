import { cardAt, hiddenToday, todayCards } from './today-cards';

const none = { followUp: false, nudge: false, medicine: false, risk: false, challenge: false, reason: false };

describe('Today cards', () => {
  it('always has the plan and an article, most useful first', () => {
    expect(todayCards(none)).toEqual(['plan', 'article']);
    expect(todayCards({ followUp: true, nudge: false, medicine: true, risk: true, challenge: true, reason: true })).toEqual([
      'followUp',
      'medicine',
      'risk',
      'challenge',
      'reason',
      'plan',
      'article',
    ]);
  });

  it('hides cards marked done, but never a question waiting for an answer', () => {
    expect(todayCards({ ...none, followUp: true, risk: true, reason: true }, ['risk', 'followUp', 'article'])).toEqual(['followUp', 'reason', 'plan']);
  });

  it('leaves the article out while articles are switched off', () => {
    expect(todayCards({ ...none, reason: true, article: false })).toEqual(['reason', 'plan']);
  });

  it('goes round with "Next card"', () => {
    const cards = todayCards({ ...none, reason: true });
    expect([0, 1, 2, 3].map((n) => cardAt(cards, n))).toEqual(['reason', 'plan', 'article', 'reason']);
    expect(cardAt([], 2)).toBeUndefined();
  });

  it('forgets hidden cards the next day and ignores unknown values', () => {
    expect(hiddenToday({ day: '2026-10-27', cards: ['risk', 'nope', 3] }, '2026-10-27')).toEqual(['risk']);
    expect(hiddenToday({ day: '2026-10-26', cards: ['risk'] }, '2026-10-27')).toEqual([]);
    expect(hiddenToday(null, '2026-10-27')).toEqual([]);
  });
});
