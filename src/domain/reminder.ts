import { cigarettesAvoided, moneySaved, smokeFreeSince } from './stats';
import { DAY } from './time';
import type { Profile, SmokeEvent } from './types';

/**
 * The daily reminder ("the evening message"). A repeating notification can't change its words, so
 * the next days are set one by one, and set again whenever the app opens or a cigarette is logged:
 * the numbers stay true. Pure functions; services/actions schedules them.
 */
export const REMINDER_DAYS_AHEAD = 7;

/** The next `count` local times at hour:minute, after `now`. */
export function nextDailyTimes(now: number, hour: number, minute: number, count = REMINDER_DAYS_AHEAD): number[] {
  const first = new Date(now);
  first.setHours(hour, minute, 0, 0);
  if (first.getTime() <= now) first.setDate(first.getDate() + 1);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(first);
    d.setDate(first.getDate() + i);
    return d.getTime();
  });
}

/**
 * What the reminder at `at` can honestly say: the day count and the money kept. In quit mode both
 * run on to `at` (a slip would be logged and the reminders set again). In cut-down mode the money
 * is what was kept by `now`, since the cigarettes still to come are unknown. Nothing in watch mode,
 * or before anything is kept.
 */
export function progressAt(profile: Profile, smokes: SmokeEvent[], at: number, now: number): { day: number; kept: number } | undefined {
  if (profile.mode === 'watch') return undefined;
  const since = profile.mode === 'quit' ? smokeFreeSince(smokes, profile) : profile.startedAt;
  const kept = moneySaved(cigarettesAvoided(smokes, profile, profile.mode === 'quit' ? at : now), profile);
  if (kept <= 0) return undefined;
  return { day: Math.floor((at - since) / DAY) + 1, kept };
}
