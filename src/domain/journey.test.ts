import {
  challengeStatus,
  personalBests,
  personalRank,
  pointsBetween,
  POINTS,
  suggestEasier,
  unlockedLevels,
  weekKey,
  weeklyPoints,
  weeklyPointsSoFar,
  weekStart,
  type JourneyData,
} from './journey';
import { computeMemories } from './memories';
import { addDays, DAY, HOUR } from './time';
import type { Profile } from './types';

// Thursday 1 October 2026, 20:00 local.
const NOW = new Date(2026, 9, 1, 20, 0).getTime();
const MONDAY = weekStart(NOW);
const daysAgo = (d: number, hour = 12) => {
  const t = new Date(NOW - d * DAY);
  t.setHours(hour, 0, 0, 0);
  return t.getTime();
};

function data(over: Partial<JourneyData> = {}): JourneyData {
  return { startedAt: daysAgo(30), smokes: [], cravings: [], surfs: [], lessons: [], plans: [], challenges: [], supports: [], ...over };
}
const beaten = (at: number, extra = {}) => ({ id: `c${at}`, at, beaten: true, ...extra });
const surf = (at: number, extra = {}) => ({ id: `s${at}`, at, startedAt: at - 2 * 60_000, ...extra });

describe('weeks', () => {
  it('start on local Monday', () => {
    expect(new Date(MONDAY).getDay()).toBe(1);
    expect(weekKey(NOW)).toBe('2026-09-28');
  });
});

describe('points', () => {
  it('reward healthy actions and never subtract for a cigarette', () => {
    const d = data({
      startedAt: MONDAY - 10 * DAY,
      cravings: [beaten(MONDAY + HOUR), { id: 'x', at: MONDAY + 2 * HOUR, beaten: false }],
      surfs: [surf(MONDAY + 3 * HOUR)],
      lessons: [{ id: 'lungs', at: MONDAY + 4 * HOUR }],
      smokes: [{ id: 'sm', at: MONDAY + 5 * HOUR }],
    });
    const pts = pointsBetween(d, MONDAY, addDays(MONDAY, 7), NOW);
    // Monday had a cigarette; Tuesday and Wednesday were smoke-free and are over; Thursday is not over yet.
    expect(pts).toBe(POINTS.cravingHandled + POINTS.surfCompleted + POINTS.lessonRead + 2 * POINTS.smokeFreeDay);
  });

  it('reward supporting others a little, capped per day so posting a lot earns nothing extra', () => {
    const d = data({ startedAt: NOW - HOUR, supports: Array.from({ length: 10 }, (_, i) => ({ id: `s${i}`, at: NOW - i * 60_000 })) });
    expect(pointsBetween(d, MONDAY, addDays(MONDAY, 7), NOW)).toBe(POINTS.supportPerDayCap * POINTS.supportGiven);
  });

  it('do not count days that have not finished', () => {
    const d = data({ startedAt: MONDAY - DAY });
    expect(pointsBetween(d, MONDAY, addDays(MONDAY, 7), MONDAY + 12 * HOUR)).toBe(0);
  });

  it('rank this week among the member’s own weeks', () => {
    expect(personalRank([{ week: 'a', points: 50 }, { week: 'b', points: 80 }, { week: 'c', points: 60 }])).toEqual({ rank: 2, of: 3 });
    expect(personalRank([{ week: 'a', points: 10 }])).toBeUndefined();
  });

  it('compares this unfinished week with the same point of past weeks', () => {
    // Last week: one craving on Monday and five on Saturday. This week (Thursday): two so far.
    const d = data({
      startedAt: addDays(MONDAY, -7),
      cravings: [beaten(addDays(MONDAY, -7) + HOUR), ...[1, 2, 3, 4, 5].map((i) => beaten(addDays(MONDAY, -2) + i * HOUR)), beaten(MONDAY + HOUR), beaten(MONDAY + 2 * HOUR)],
    });
    const whole = weeklyPoints(d, NOW).map((w) => w.points);
    const soFar = weeklyPointsSoFar(d, NOW).map((w) => w.points);
    expect(whole[0]).toBeGreaterThan(whole[1]);
    expect(soFar[0]).toBeLessThan(soFar[1]);
  });

  it('only lists weeks since the member started', () => {
    expect(weeklyPoints(data({ startedAt: MONDAY + HOUR }), NOW)).toHaveLength(1);
  });
});

describe('weekly challenges', () => {
  const join = (challengeId: string, week = weekKey(NOW)) => ({ week, challengeId, joinedAt: MONDAY });

  it('measure progress only inside their own week', () => {
    const d = data({ surfs: [surf(MONDAY - DAY)], challenges: [join('surf-1')] });
    expect(challengeStatus(d, d.challenges[0])?.done).toBe(false);
    const d2 = data({ surfs: [surf(MONDAY + HOUR)], challenges: [join('surf-1')] });
    expect(challengeStatus(d2, d2.challenges[0])).toMatchObject({ done: true, progress: 1, completedAt: MONDAY + HOUR });
  });

  it('unlock the next level after two completed challenges, and keep lower levels open', () => {
    const w1 = weekKey(NOW - 14 * DAY);
    const w2 = weekKey(NOW - 7 * DAY);
    expect(unlockedLevels(data())).toEqual(['easy']);
    const d = data({
      surfs: [surf(weekStart(NOW - 14 * DAY) + HOUR), surf(weekStart(NOW - 7 * DAY) + HOUR)],
      challenges: [join('surf-1', w1), join('surf-1', w2)],
    });
    expect(unlockedLevels(d)).toEqual(['easy', 'medium']);
  });

  it('suggest an easier challenge after two unfinished harder ones, never for easy', () => {
    const w1 = weekKey(NOW - 14 * DAY);
    const w2 = weekKey(NOW - 7 * DAY);
    expect(suggestEasier(data({ challenges: [join('learn-2', w1), join('learn-2', w2)] }), NOW)).toBe(true);
    expect(suggestEasier(data({ challenges: [join('learn-1', w1), join('learn-1', w2)] }), NOW)).toBe(false);
  });

  it('a medium "strong craving" challenge needs a strong craving, not fewer cigarettes', () => {
    const d = data({ surfs: [surf(MONDAY + HOUR, { before: 5 })], challenges: [join('surf-strong')] });
    expect(challengeStatus(d, d.challenges[0])?.done).toBe(false);
    const d2 = data({ surfs: [surf(MONDAY + HOUR, { before: 8 })], challenges: [join('surf-strong')] });
    expect(challengeStatus(d2, d2.challenges[0])?.done).toBe(true);
  });

  it('ignore unknown challenge ids', () => {
    expect(challengeStatus(data(), join('give-me-points'))).toBeUndefined();
  });
});

describe('personal bests', () => {
  it('track best week, lessons and active-day streaks without punishing a gap', () => {
    const d = data({
      cravings: [beaten(daysAgo(10)), beaten(daysAgo(9)), beaten(daysAgo(9, 15)), beaten(daysAgo(1))],
      surfs: [surf(daysAgo(0, 9))],
      lessons: [{ id: 'lungs', at: daysAgo(2) }],
    });
    expect(personalBests(d, NOW)).toEqual({
      bestWeekCravings: 3,
      lessonsRead: 1,
      surfsCompleted: 1,
      currentActiveStreak: 3,
      bestActiveStreak: 3,
    });
  });
});

describe('memories', () => {
  const profile: Profile = {
    cigsPerDay: 10,
    pricePerPack: 10,
    cigsPerPack: 20,
    currency: '$',
    wakeHours: 16,
    mode: 'quit',
    startedAt: daysAgo(30),
    quitAt: daysAgo(30),
    weeklyStep: 0.1,
  };

  it('carry the real date they happened and stay unlocked after a slip', () => {
    const d = data({ cravings: [beaten(daysAgo(5, 19))], smokes: [{ id: 's', at: daysAgo(1) }] });
    const byId = Object.fromEntries(computeMemories(profile, d, NOW).map((m) => [m.id, m]));
    expect(byId['first-craving'].unlockedAt).toBe(daysAgo(5, 19));
    expect(byId['evening-win'].unlockedAt).toBe(daysAgo(5, 19));
    expect(byId['evening-win'].hidden).toBe(true);
    expect(byId['week-free'].unlockedAt).toBe(daysAgo(30) + 7 * DAY);
    expect(byId['first-surf'].unlockedAt).toBeUndefined();
    expect(byId['cravings-10'].progress).toEqual({ current: 1, target: 10 });
  });

  it('unlock trigger discovery on the third time the same trigger is tagged', () => {
    const d = data({
      cravings: [beaten(daysAgo(3), { trigger: 'coffee' }), beaten(daysAgo(2), { trigger: 'coffee' })],
      smokes: [{ id: 's', at: daysAgo(1), trigger: 'coffee' }],
    });
    const m = computeMemories(profile, d, NOW).find((x) => x.id === 'trigger-discovery');
    expect(m?.unlockedAt).toBe(daysAgo(1));
  });
});
