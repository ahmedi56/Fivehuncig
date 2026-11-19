import { DAY } from './time';
import type { CravingEvent, SmokeEvent } from './types';

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

/** Local-time hour ranges, shown to the member so the insight is concrete. */
export const DAY_PARTS: Record<DayPart, { from: number; to: number }> = {
  morning: { from: 5, to: 12 },
  afternoon: { from: 12, to: 17 },
  evening: { from: 17, to: 22 },
  night: { from: 22, to: 5 },
};

export function dayPartOf(at: number): DayPart {
  const h = new Date(at).getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

export interface CravingTimeInsight {
  /** Cravings and cigarettes counted. */
  total: number;
  part: DayPart;
  count: number;
}

/** Below this many events a "pattern" is noise, so no insight is shown. */
export const MIN_EVENTS_FOR_INSIGHT = 6;

/**
 * "When do your cravings usually happen?" Counts cravings and cigarettes in the last `days`.
 * Returns nothing unless there is enough data and one part of the day clearly stands out
 * (at least 40% of events and more than any other part), so we never overclaim.
 */
export function cravingTimeInsight(
  cravings: CravingEvent[],
  smokes: SmokeEvent[],
  now: number,
  days = 30,
): CravingTimeInsight | undefined {
  const from = now - days * DAY;
  const counts: Record<DayPart, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  let total = 0;
  for (const e of [...cravings, ...smokes]) {
    if (e.at < from || e.at > now) continue;
    counts[dayPartOf(e.at)]++;
    total++;
  }
  if (total < MIN_EVENTS_FOR_INSIGHT) return undefined;
  const sorted = (Object.keys(counts) as DayPart[]).sort((a, b) => counts[b] - counts[a]);
  const [top, second] = sorted;
  if (counts[top] === counts[second] || counts[top] / total < 0.4) return undefined;
  return { total, part: top, count: counts[top] };
}
