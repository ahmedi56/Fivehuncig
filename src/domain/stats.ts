import { addDays, DAY, dayKey, startOfDay } from './time';
import type { CravingEvent, Profile, SmokeEvent, TriggerId } from './types';

export function countBetween(events: SmokeEvent[], from: number, to: number): number {
  let n = 0;
  for (const e of events) if (e.at >= from && e.at < to) n++;
  return n;
}

export function countToday(events: SmokeEvent[], now: number): number {
  const start = startOfDay(now);
  return countBetween(events, start, addDays(start, 1));
}

/** Counts per calendar day for the last `days` days (oldest first, today last). */
export function dailyCounts(events: SmokeEvent[], now: number, days: number): { key: string; count: number }[] {
  const today = startOfDay(now);
  const out: { key: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const from = addDays(today, -i);
    out.push({ key: dayKey(from), count: countBetween(events, from, addDays(from, 1)) });
  }
  return out;
}

/** Average cigarettes per day over the last `days` *complete-or-current* days since start. */
export function recentAverage(events: SmokeEvent[], profile: Profile, now: number, days = 7): number {
  const daysSinceStart = Math.floor((startOfDay(now) - startOfDay(profile.startedAt)) / DAY) + 1;
  const span = Math.max(1, Math.min(days, daysSinceStart));
  const from = addDays(startOfDay(now), -(span - 1));
  return countBetween(events, from, now + 1) / span;
}

/**
 * Cigarettes not smoked compared with the baseline.
 * Past days count the full baseline; today counts the baseline pro-rated by time elapsed,
 * so nobody gets credit for cigarettes they simply haven't had time to smoke yet.
 */
export function cigarettesAvoided(events: SmokeEvent[], profile: Profile, now: number): number {
  const startDay = startOfDay(profile.startedAt);
  const today = startOfDay(now);
  let avoided = 0;
  for (let day = startDay; day <= today; day = addDays(day, 1)) {
    const next = addDays(day, 1);
    const windowStart = Math.max(day, profile.startedAt);
    const windowEnd = Math.min(next, now);
    if (windowEnd <= windowStart) continue;
    const expected = profile.cigsPerDay * ((windowEnd - windowStart) / (next - day));
    const actual = countBetween(events, windowStart, windowEnd);
    avoided += Math.max(0, expected - actual);
  }
  return Math.floor(avoided);
}

export function moneySaved(avoided: number, profile: Pick<Profile, 'pricePerPack' | 'cigsPerPack'>): number {
  if (profile.cigsPerPack <= 0) return 0;
  return (avoided * profile.pricePerPack) / profile.cigsPerPack;
}

/** Pass the app language's number formatter; the default follows the device locale. */
export function formatMoney(amount: number, currency: string, formatNumber: (n: number) => string = (n) => n.toLocaleString()): string {
  const rounded = amount >= 100 ? formatNumber(Math.round(amount)) : amount.toFixed(2);
  // "$2.50" but "MAD 2.50": a letter code needs a space to stay readable.
  // Explicit Latin + Arabic letter ranges rather than \p{L}, which not every JS engine accepts.
  return /^[A-Za-z\u00C0-\u024F\u0600-\u06FF]{2,}$/.test(currency) ? `${currency} ${rounded}` : `${currency}${rounded}`;
}

/** Time since the last cigarette, or since quitting/starting if none was logged after it. */
export function smokeFreeSince(events: SmokeEvent[], profile: Profile): number {
  const anchor = profile.quitAt ?? profile.startedAt;
  let last = anchor;
  for (const e of events) if (e.at > last) last = e.at;
  return last;
}

/** Longest gap between cigarettes (ms) since the user started. */
export function bestStreak(events: SmokeEvent[], profile: Profile, now: number): number {
  const times = events.map((e) => e.at).filter((t) => t >= profile.startedAt).sort((a, b) => a - b);
  let prev = profile.startedAt;
  let best = 0;
  for (const t of times) {
    best = Math.max(best, t - prev);
    prev = t;
  }
  return Math.max(best, now - prev);
}

/** Full calendar days (since start, excluding today) with zero cigarettes. A slip never erases these. */
export function smokeFreeDays(events: SmokeEvent[], profile: Profile, now: number): number {
  const today = startOfDay(now);
  let n = 0;
  for (let day = addDays(startOfDay(profile.startedAt), 1); day < today; day = addDays(day, 1)) {
    if (countBetween(events, day, addDays(day, 1)) === 0) n++;
  }
  return n;
}

export function cravingsBeaten(cravings: CravingEvent[]): number {
  return cravings.filter((c) => c.beaten).length;
}

/**
 * Most common triggers in the last `days` days, from tagged cravings and cigarettes.
 * Most frequent first; ties keep the order the triggers were first seen.
 */
export function topTriggers(
  smokes: SmokeEvent[],
  cravings: CravingEvent[],
  now: number,
  days = 30,
): { trigger: TriggerId; count: number }[] {
  const from = now - days * DAY;
  const counts = new Map<TriggerId, number>();
  for (const e of [...smokes, ...cravings]) {
    if (e.trigger && e.at >= from && e.at <= now) counts.set(e.trigger, (counts.get(e.trigger) ?? 0) + 1);
  }
  return [...counts].map(([trigger, count]) => ({ trigger, count })).sort((a, b) => b.count - a.count);
}
