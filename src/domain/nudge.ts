import { currentGap } from './schedule';
import { recentAverage } from './stats';
import { DAY, HOUR } from './time';
import type { Profile, SmokeEvent } from './types';

/** `drop` is how much less the user smokes than their baseline, in percent. Wording lives in src/i18n. */
export type Nudge = { kind: 'try-cutdown'; drop: number } | { kind: 'try-quit' } | undefined;

/**
 * "Not ready" does not mean "won't quit". When the user's own data shows progress,
 * gently offer the next step — once, never as a demand. Returns undefined if no nudge.
 */
export function readinessNudge(profile: Profile, smokes: SmokeEvent[], now: number): Nudge {
  const daysIn = (now - profile.startedAt) / DAY;
  if (daysIn < 3 || profile.mode === 'quit') return undefined;
  const avg = recentAverage(smokes, profile, now, 7);

  if (profile.mode === 'watch' && avg < profile.cigsPerDay) {
    const drop = Math.round((1 - avg / profile.cigsPerDay) * 100);
    if (drop >= 10) return { kind: 'try-cutdown', drop };
  }

  if (profile.mode === 'cutdown') {
    const gap = currentGap(profile, now);
    if (avg <= profile.cigsPerDay * 0.5 || gap >= 3 * HOUR) {
      return { kind: 'try-quit' };
    }
  }
  return undefined;
}
