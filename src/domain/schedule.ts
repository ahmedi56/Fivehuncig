import { HOUR, MINUTE, WEEK } from './time';
import type { Profile, SmokeEvent } from './types';

/**
 * Next Cigarette Timer — scheduled reduced smoking.
 *
 * The baseline gap spreads the user's usual cigarettes across their awake hours.
 * Every full week on the plan, the gap grows by `weeklyStep` (compounding).
 * Based on scheduled-reduction trials (e.g. Cinciripini 1995) and Cochrane 2019
 * "cut down to quit" evidence.
 */

/** Minimum and maximum gap the timer will ever ask for. */
export const MIN_GAP = 15 * MINUTE;

export function baselineGap(profile: Pick<Profile, 'cigsPerDay' | 'wakeHours'>): number {
  const perDay = Math.max(1, profile.cigsPerDay);
  const awake = Math.min(24, Math.max(1, profile.wakeHours)) * HOUR;
  return Math.max(MIN_GAP, awake / perDay);
}

/** Whole weeks since the cut-down plan started. */
export function weeksOnPlan(profile: Profile, now: number): number {
  const start = profile.cutdownStartedAt ?? profile.startedAt;
  return Math.max(0, Math.floor((now - start) / WEEK));
}

/** The gap the timer asks for right now, capped at the user's awake hours (1 a day). */
export function currentGap(profile: Profile, now: number): number {
  const step = Math.min(1, Math.max(0, profile.weeklyStep));
  const gap = baselineGap(profile) * Math.pow(1 + step, weeksOnPlan(profile, now));
  return Math.min(gap, Math.max(1, profile.wakeHours) * HOUR);
}

/** Target cigarettes per day implied by the current gap. */
export function targetPerDay(profile: Profile, now: number): number {
  return Math.max(1, Math.round((profile.wakeHours * HOUR) / currentGap(profile, now)));
}

export function lastSmoke(events: SmokeEvent[]): SmokeEvent | undefined {
  let latest: SmokeEvent | undefined;
  for (const e of events) if (!latest || e.at > latest.at) latest = e;
  return latest;
}

/** When the next cigarette is "allowed". Undefined = allowed now (no cigarette logged yet). */
export function nextAllowedAt(profile: Profile, events: SmokeEvent[], now: number): number | undefined {
  const last = lastSmoke(events);
  if (!last) return undefined;
  return last.at + currentGap(profile, now);
}

export function isEarly(profile: Profile, events: SmokeEvent[], now: number): boolean {
  const allowed = nextAllowedAt(profile, events, now);
  return allowed !== undefined && now < allowed;
}
