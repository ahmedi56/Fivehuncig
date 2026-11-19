import { milestoneProgress, nextMilestone } from './health';
import { readinessNudge } from './nudge';
import { baselineGap, currentGap, isEarly, nextAllowedAt, targetPerDay } from './schedule';
import {
  bestStreak,
  cigarettesAvoided,
  countToday,
  dailyCounts,
  formatMoney,
  moneySaved,
  recentAverage,
  smokeFreeDays,
  smokeFreeSince,
  topTriggers,
} from './stats';
import { DAY, formatClock, formatDuration, HOUR, MINUTE, startOfDay, WEEK } from './time';
import type { Profile, SmokeEvent } from './types';
import { cleanText, validateProfileForm } from './validate';

// Fixed local "now": 2026-10-01 15:00 local time.
const NOW = new Date(2026, 9, 1, 15, 0, 0).getTime();

function profile(over: Partial<Profile> = {}): Profile {
  return {
    cigsPerDay: 16,
    pricePerPack: 1000,
    cigsPerPack: 20,
    currency: '₦',
    wakeHours: 16,
    mode: 'cutdown',
    startedAt: NOW - 10 * DAY,
    weeklyStep: 0.1,
    ...over,
  };
}

let idCounter = 0;
const smoke = (at: number): SmokeEvent => ({ id: String(idCounter++), at });

describe('schedule (Next Cigarette Timer)', () => {
  it('spreads baseline cigarettes over awake hours', () => {
    expect(baselineGap(profile())).toBe(HOUR); // 16 cigs over 16 h
  });

  it('never asks for less than 15 minutes between cigarettes', () => {
    expect(baselineGap(profile({ cigsPerDay: 100 }))).toBe(15 * MINUTE);
  });

  it('grows the gap by the weekly step for each full week on the plan', () => {
    const p = profile({ cutdownStartedAt: NOW - 2 * WEEK - HOUR });
    expect(currentGap(p, NOW)).toBeCloseTo(HOUR * 1.1 * 1.1, 0);
    expect(currentGap(profile({ cutdownStartedAt: NOW - 6 * DAY }), NOW)).toBe(HOUR);
  });

  it('caps the gap at one cigarette per awake day', () => {
    const p = profile({ cutdownStartedAt: NOW - 200 * WEEK });
    expect(currentGap(p, NOW)).toBe(16 * HOUR);
    expect(targetPerDay(p, NOW)).toBe(1);
  });

  it('allows the first cigarette immediately and times the next one from the last', () => {
    const p = profile({ cutdownStartedAt: NOW });
    expect(nextAllowedAt(p, [], NOW)).toBeUndefined();
    const events = [smoke(NOW - 3 * HOUR), smoke(NOW - 20 * MINUTE)];
    expect(nextAllowedAt(p, events, NOW)).toBe(NOW - 20 * MINUTE + HOUR);
    expect(isEarly(p, events, NOW)).toBe(true);
    expect(isEarly(p, events, NOW + HOUR)).toBe(false);
  });
});

describe('stats', () => {
  it('counts today and per day', () => {
    const events = [smoke(startOfDay(NOW) + HOUR), smoke(NOW - MINUTE), smoke(NOW - DAY)];
    expect(countToday(events, NOW)).toBe(2);
    const days = dailyCounts(events, NOW, 3);
    expect(days.map((d) => d.count)).toEqual([0, 1, 2]);
  });

  it('pro-rates today when counting avoided cigarettes', () => {
    // Started at local midnight today, 15 h elapsed of 24 → expected 10 of 16.
    const p = profile({ startedAt: startOfDay(NOW) });
    expect(cigarettesAvoided([], p, NOW)).toBe(10);
    expect(cigarettesAvoided([smoke(NOW - HOUR), smoke(NOW - 2 * HOUR)], p, NOW)).toBe(8);
  });

  it('does not give negative credit on heavy days', () => {
    const p = profile({ startedAt: startOfDay(NOW) });
    const many = Array.from({ length: 40 }, (_, i) => smoke(startOfDay(NOW) + i * MINUTE));
    expect(cigarettesAvoided(many, p, NOW)).toBe(0);
  });

  it('turns avoided cigarettes into money', () => {
    expect(moneySaved(20, profile())).toBe(1000);
    expect(moneySaved(5, { pricePerPack: 10, cigsPerPack: 0 })).toBe(0);
    expect(formatMoney(2.5, '$')).toBe('$2.50');
    expect(formatMoney(2.5, 'MAD')).toBe('MAD 2.50');
    expect(formatMoney(2.5, 'د.م.')).toBe('د.م.2.50');
    expect(formatMoney(9_627_000, 'LBP', (n) => `<${n}>`)).toBe('LBP <9627000>');
  });

  it('averages only over days since the user started', () => {
    const p = profile({ startedAt: NOW - HOUR });
    expect(recentAverage([smoke(NOW - MINUTE)], p, NOW)).toBe(1);
  });

  it('tracks streaks without erasing past smoke-free days after a slip', () => {
    const p = profile({ mode: 'quit', startedAt: NOW - 5 * DAY, quitAt: NOW - 5 * DAY });
    const slip = smoke(NOW - HOUR);
    expect(smokeFreeSince([slip], p)).toBe(slip.at);
    expect(bestStreak([slip], p, NOW)).toBe(5 * DAY - HOUR);
    expect(smokeFreeDays([slip], p, NOW)).toBe(4);
  });
});

describe('health timeline', () => {
  it('marks reached milestones and finds the next one', () => {
    const list = milestoneProgress(13 * HOUR);
    expect(list[0].reached).toBe(true);
    expect(list[1].reached).toBe(true);
    expect(list[2].reached).toBe(false);
    expect(nextMilestone(13 * HOUR)?.id).toBe('2d');
    expect(nextMilestone(100 * 365 * DAY)).toBeUndefined();
  });
});

describe('readiness nudge', () => {
  it('stays quiet in the first days and in quit mode', () => {
    expect(readinessNudge(profile({ startedAt: NOW - DAY }), [], NOW)).toBeUndefined();
    expect(readinessNudge(profile({ mode: 'quit' }), [], NOW)).toBeUndefined();
  });

  it('suggests the timer to watchers who already cut down', () => {
    const p = profile({ mode: 'watch' });
    const events = Array.from({ length: 7 * 10 }, (_, i) => smoke(NOW - i * 2 * HOUR));
    expect(readinessNudge(p, events, NOW)?.kind).toBe('try-cutdown');
  });

  it('suggests a smoke-free day to cut-downers at half their baseline', () => {
    const events = Array.from({ length: 7 * 6 }, (_, i) => smoke(NOW - i * 4 * HOUR));
    expect(readinessNudge(profile(), events, NOW)?.kind).toBe('try-quit');
  });
});

describe('validation', () => {
  const good = { cigsPerDay: '15', pricePerPack: '1,500', cigsPerPack: '20', currency: ' ₦ ', wakeHours: '16' };

  it('parses valid input', () => {
    const r = validateProfileForm(good);
    expect(r.ok && r.value).toEqual({ cigsPerDay: 15, pricePerPack: 1500, cigsPerPack: 20, currency: '₦', wakeHours: 16 });
  });

  it('reads numbers typed on Arabic and French keyboards', () => {
    const r = validateProfileForm({ ...good, cigsPerDay: '١٥', pricePerPack: '١٢٫٥', wakeHours: '۱۶' });
    expect(r.ok && [r.value.cigsPerDay, r.value.pricePerPack, r.value.wakeHours]).toEqual([15, 12.5, 16]);
    const fr = validateProfileForm({ ...good, pricePerPack: '1\u202F500,50' });
    expect(fr.ok && fr.value.pricePerPack).toBe(1500.5);
    expect(validateProfileForm({ ...good, pricePerPack: '1 500' }).ok).toBe(true);
  });

  it('allows an empty price', () => {
    const r = validateProfileForm({ ...good, pricePerPack: '' });
    expect(r.ok && r.value.pricePerPack).toBe(0);
  });

  it('rejects bad numbers', () => {
    const r = validateProfileForm({ ...good, cigsPerDay: '0', cigsPerPack: 'abc', wakeHours: '30' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['cigsPerDay', 'cigsPerPack', 'wakeHours']);
  });

  it('cleans free text', () => {
    expect(cleanText('   ')).toBeUndefined();
    expect(cleanText('  my   kids  ')).toBe('my kids');
    expect(cleanText('x'.repeat(500))?.length).toBe(140);
  });
});

describe('time formatting', () => {
  it('formats durations and clocks', () => {
    expect(formatDuration(2 * HOUR + 5 * MINUTE)).toBe('2h 05m');
    expect(formatDuration(3 * DAY + 4 * HOUR)).toBe('3d 4h');
    expect(formatClock(5 * MINUTE)).toBe('05:00');
    expect(formatClock(HOUR + 1000)).toBe('1:00:01');
  });

  it('shows days only from 100 days, so long streaks fit the ring', () => {
    expect(formatDuration(99 * DAY + 4 * HOUR)).toBe('99d 4h');
    expect(formatDuration(1284 * DAY + 23 * HOUR, undefined, (n) => n.toLocaleString('en'))).toBe('1,284d');
  });

  it('uses translated units when given', () => {
    expect(formatDuration(2 * HOUR + 5 * MINUTE, { d: ' j', h: ' h', m: ' min', s: ' s' })).toBe('2 h 05 min');
  });
});

describe('trigger patterns', () => {
  it('counts tagged cravings and cigarettes from the last 30 days, most common first', () => {
    const smokes: SmokeEvent[] = [
      { id: 'a', at: NOW - HOUR, trigger: 'coffee' },
      { id: 'b', at: NOW - 2 * HOUR },
      { id: 'c', at: NOW - 40 * DAY, trigger: 'stress' },
    ];
    const cravings = [
      { id: 'd', at: NOW - DAY, beaten: true, trigger: 'stress' as const },
      { id: 'e', at: NOW - 2 * DAY, beaten: false, trigger: 'stress' as const },
    ];
    expect(topTriggers(smokes, cravings, NOW)).toEqual([
      { trigger: 'stress', count: 2 },
      { trigger: 'coffee', count: 1 },
    ]);
  });
});
