import { completedChallenges, idTime, type JourneyData } from './journey';
import { cigarettesAvoided, moneySaved } from './stats';
import { addDays, DAY, startOfDay } from './time';
import type { Profile } from './types';

export type MemoryId =
  | 'started'
  | 'first-plan'
  | 'first-craving'
  | 'first-surf'
  | 'learner'
  | 'first-day'
  | 'first-savings'
  | 'trigger-discovery'
  | 'evening-win'
  | 'cravings-10'
  | 'surfer-5'
  | 'week-free'
  | 'first-challenge'
  | 'helping-hand';

export interface Memory {
  id: MemoryId;
  emoji: string;
  /** When it happened, taken from the member's own data. Undefined while locked. */
  unlockedAt?: number;
  /** Progress towards unlocking, when it can be counted. */
  progress?: { current: number; target: number };
  /** Hidden memories show "???" until found, so there is something to discover. */
  hidden?: boolean;
}

/** The time of the n-th (1-based) item in ascending order, if there are that many. */
function nth(times: number[], n: number): number | undefined {
  return [...times].sort((a, b) => a - b)[n - 1];
}

/**
 * Meaningful moments in the journey. Wording lives in the translations (`memories`).
 * Everything is recomputed from logged events, so a memory can't be unlocked twice and never
 * disappears after a slip.
 */
export function computeMemories(profile: Profile, data: JourneyData, now: number): Memory[] {
  const beaten = data.cravings.filter((c) => c.beaten).map((c) => c.at);
  const surfs = data.surfs.map((s) => s.at);
  const planTimes = data.plans.map((p) => idTime(p.id)).filter((t): t is number => t !== undefined);

  const tagged = new Map<string, number[]>();
  for (const e of [...data.cravings, ...data.smokes]) {
    if (e.trigger) tagged.set(e.trigger, [...(tagged.get(e.trigger) ?? []), e.at]);
  }
  const triggerFound = [...tagged.values()].map((times) => nth(times, 3)).filter((t): t is number => t !== undefined);

  const evening = data.cravings.filter((c) => c.beaten && new Date(c.at).getHours() >= 17 && new Date(c.at).getHours() < 22).map((c) => c.at);

  return [
    { id: 'started', emoji: '👣', unlockedAt: profile.startedAt },
    { id: 'first-plan', emoji: '🧠', unlockedAt: nth(planTimes, 1) },
    { id: 'first-craving', emoji: '🌊', unlockedAt: nth(beaten, 1) },
    { id: 'first-surf', emoji: '🏄', unlockedAt: nth(surfs, 1) },
    { id: 'learner', emoji: '📚', unlockedAt: nth(data.lessons.map((l) => l.at), 1) },
    { id: 'first-day', emoji: '🌅', unlockedAt: firstSmokeFreeDay(data, now) },
    { id: 'first-savings', emoji: '💰', unlockedAt: firstPackSaved(profile, data, now) },
    { id: 'trigger-discovery', emoji: '🧭', unlockedAt: triggerFound.length ? Math.min(...triggerFound) : undefined, hidden: true },
    { id: 'evening-win', emoji: '🌙', unlockedAt: nth(evening, 1), hidden: true },
    { id: 'cravings-10', emoji: '🔥', unlockedAt: nth(beaten, 10), progress: { current: Math.min(10, beaten.length), target: 10 } },
    { id: 'surfer-5', emoji: '🌊', unlockedAt: nth(surfs, 5), progress: { current: Math.min(5, surfs.length), target: 5 } },
    {
      id: 'week-free',
      emoji: '🏆',
      unlockedAt: firstStreakOf(data, 7 * DAY, now),
      progress: { current: Math.min(7, Math.floor(longestGap(data, now) / DAY)), target: 7 },
    },
    { id: 'first-challenge', emoji: '🎯', unlockedAt: nth(completedChallenges(data).map((s) => s.completedAt ?? now), 1) },
    { id: 'helping-hand', emoji: '🤝', unlockedAt: nth(data.supports.map((s) => s.at), 1) },
  ];
}

/** End of the first full calendar day after starting with no cigarette logged. */
function firstSmokeFreeDay(data: JourneyData, now: number): number | undefined {
  for (let day = addDays(startOfDay(data.startedAt), 1); addDays(day, 1) <= now; day = addDays(day, 1)) {
    const end = addDays(day, 1);
    if (!data.smokes.some((s) => s.at >= day && s.at < end)) return end;
  }
  return undefined;
}

/** End of the first day on which the estimated savings reached the price of one pack. */
function firstPackSaved(profile: Profile, data: JourneyData, now: number): number | undefined {
  if (profile.pricePerPack <= 0) return undefined;
  for (let end = addDays(startOfDay(profile.startedAt), 1); ; end = addDays(end, 1)) {
    const at = Math.min(end, now);
    if (moneySaved(cigarettesAvoided(data.smokes, profile, at), profile) >= profile.pricePerPack) return at;
    if (end >= now) return undefined;
  }
}

function sortedSmokeTimes(data: JourneyData): number[] {
  return data.smokes.map((s) => s.at).filter((t) => t >= data.startedAt).sort((a, b) => a - b);
}

function longestGap(data: JourneyData, now: number): number {
  let prev = data.startedAt;
  let best = 0;
  for (const t of sortedSmokeTimes(data)) {
    best = Math.max(best, t - prev);
    prev = t;
  }
  return Math.max(best, now - prev);
}

/** The moment the member first went `length` without a cigarette. */
function firstStreakOf(data: JourneyData, length: number, now: number): number | undefined {
  let prev = data.startedAt;
  for (const t of sortedSmokeTimes(data)) {
    if (t - prev >= length) return prev + length;
    prev = t;
  }
  return now - prev >= length ? prev + length : undefined;
}
