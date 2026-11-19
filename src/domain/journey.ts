import { addDays, dayKey, startOfDay } from './time';
import type { ChallengeEntry, CravingEvent, CravingTool, Difficulty, LessonRead, Plan, SmokeEvent, SupportGiven, UrgeSurfSession } from './types';

/**
 * Everything the "journey" features (points, challenges, personal bests) are computed from.
 * All of it is derived from the member's own logged events, never stored as a score, so a
 * point can't be counted twice and nothing can be "lost".
 */
export interface JourneyData {
  startedAt: number;
  smokes: SmokeEvent[];
  cravings: CravingEvent[];
  surfs: UrgeSurfSession[];
  lessons: LessonRead[];
  plans: Plan[];
  challenges: ChallengeEntry[];
  /** Replies that supported someone else in the community. */
  supports: SupportGiven[];
}

// ---------- weeks ----------

/** Local Monday 00:00 of the week containing `t`. */
export function weekStart(t: number): number {
  const d = new Date(startOfDay(t));
  const offset = (d.getDay() + 6) % 7; // Monday = 0
  return addDays(d.getTime(), -offset);
}

export const weekKey = (t: number) => dayKey(weekStart(t));

const inRange = (at: number, from: number, to: number) => at >= from && at < to;

/** Creation time encoded in ids made by `newId()` (base-36 timestamp prefix). */
export function idTime(id: string): number | undefined {
  const n = parseInt(id.split('-')[0], 36);
  return Number.isFinite(n) && n > 1_500_000_000_000 ? n : undefined;
}

// ---------- weekly challenges ----------

export interface WeekEvents {
  cravings: CravingEvent[];
  surfs: UrgeSurfSession[];
  lessons: LessonRead[];
  smokes: SmokeEvent[];
}

export function eventsBetween(data: JourneyData, from: number, to: number): WeekEvents {
  return {
    cravings: data.cravings.filter((e) => inRange(e.at, from, to)),
    surfs: data.surfs.filter((e) => inRange(e.at, from, to)),
    lessons: data.lessons.filter((e) => inRange(e.at, from, to)),
    smokes: data.smokes.filter((e) => inRange(e.at, from, to)),
  };
}

const distinctDays = (times: number[]) => new Set(times.map(dayKey)).size;

/** Days with at least one healthy action (a craving handled, an exercise, a lesson). */
function activeDays(w: WeekEvents): number {
  return distinctDays([...w.cravings.filter((c) => c.beaten).map((c) => c.at), ...w.surfs.map((s) => s.at), ...w.lessons.map((l) => l.at)]);
}

export interface ChallengeDef {
  id: string;
  level: Difficulty;
  target: number;
  /** Progress towards `target` from one week's events. */
  measure: (w: WeekEvents) => number;
}

/**
 * Difficulty is about the exercise, never about smoking less: no challenge counts cigarettes,
 * and a cigarette never undoes progress.
 */
export const CHALLENGES: ChallengeDef[] = [
  { id: 'surf-1', level: 'easy', target: 1, measure: (w) => w.surfs.length },
  { id: 'learn-1', level: 'easy', target: 1, measure: (w) => w.lessons.length },
  { id: 'handle-2', level: 'easy', target: 2, measure: (w) => w.cravings.filter((c) => c.beaten).length },

  { id: 'surf-strong', level: 'medium', target: 1, measure: (w) => w.surfs.filter((s) => (s.before ?? 0) >= 7).length },
  { id: 'learn-2', level: 'medium', target: 2, measure: (w) => w.lessons.length },
  {
    id: 'triggers-3',
    level: 'medium',
    target: 3,
    measure: (w) => new Set([...w.cravings, ...w.smokes].map((e) => e.trigger).filter(Boolean)).size,
  },

  { id: 'alt-strategy-3', level: 'hard', target: 3, measure: (w) => w.cravings.filter((c) => c.beaten && c.trigger).length },
  { id: 'surf-helped-3', level: 'hard', target: 3, measure: (w) => w.surfs.filter((s) => s.helped === 'yes' || s.helped === 'little').length },
  {
    id: 'new-tools-3',
    level: 'hard',
    target: 3,
    measure: (w) =>
      new Set<CravingTool | 'surf'>([
        ...w.cravings.filter((c) => c.beaten && c.tool).map((c) => c.tool as CravingTool),
        ...(w.surfs.length ? (['surf'] as const) : []),
      ]).size,
  },

  { id: 'active-5', level: 'advanced', target: 5, measure: activeDays },
  { id: 'handle-days-5', level: 'advanced', target: 5, measure: (w) => distinctDays(w.cravings.filter((c) => c.beaten).map((c) => c.at)) },
];

export const LEVELS: Difficulty[] = ['easy', 'medium', 'hard', 'advanced'];

export function challengeById(id: string): ChallengeDef | undefined {
  return CHALLENGES.find((c) => c.id === id);
}

export interface ChallengeStatus {
  entry: ChallengeEntry;
  def: ChallengeDef;
  progress: number;
  done: boolean;
  /** When the target was reached (time of the event that completed it). */
  completedAt?: number;
}

/** Status of a joined challenge, measured only inside its own week. */
export function challengeStatus(data: JourneyData, entry: ChallengeEntry): ChallengeStatus | undefined {
  const def = challengeById(entry.challengeId);
  if (!def) return undefined;
  const from = new Date(`${entry.week}T00:00:00`).getTime();
  const to = addDays(from, 7);
  const w = eventsBetween(data, from, to);
  const progress = Math.min(def.target, def.measure(w));
  const done = progress >= def.target;
  let completedAt: number | undefined;
  if (done) {
    // Earliest moment the target was met: replay the week's events in time order.
    const times = [...w.cravings, ...w.surfs, ...w.lessons, ...w.smokes].map((e) => e.at).sort((a, b) => a - b);
    completedAt = times.find((t) => def.measure(eventsBetween(data, from, t + 1)) >= def.target) ?? to;
  }
  return { entry, def, progress, done, completedAt };
}

export function completedChallenges(data: JourneyData): ChallengeStatus[] {
  return data.challenges.map((e) => challengeStatus(data, e)).filter((s): s is ChallengeStatus => !!s?.done);
}

/** Two completed challenges at a level unlock the next one. Lower levels always stay open. */
export function unlockedLevels(data: JourneyData): Difficulty[] {
  const done = completedChallenges(data);
  const unlocked: Difficulty[] = ['easy'];
  for (let i = 1; i < LEVELS.length; i++) {
    const below = done.filter((s) => s.def.level === LEVELS[i - 1]).length;
    if (below >= 2) unlocked.push(LEVELS[i]);
    else break;
  }
  return unlocked;
}

/**
 * True when the last two joined challenges (before this week) weren't finished at a level above
 * easy: the app then offers an easier one. An offer, never a demotion.
 */
export function suggestEasier(data: JourneyData, now: number): boolean {
  const thisWeek = weekKey(now);
  const past = data.challenges.filter((e) => e.week < thisWeek).slice(-2);
  if (past.length < 2) return false;
  return past.every((e) => {
    const s = challengeStatus(data, e);
    return s && !s.done && s.def.level !== 'easy';
  });
}

// ---------- points ----------

export const POINTS = {
  cravingHandled: 10,
  surfCompleted: 15,
  lessonRead: 5,
  planMade: 5,
  smokeFreeDay: 20,
  supportGiven: 5,
  /** Supporting others is rewarded a little, not posting a lot. */
  supportPerDayCap: 3,
  challenge: { easy: 30, medium: 50, hard: 80, advanced: 120 } satisfies Record<Difficulty, number>,
} as const;

/** Points earned in [from, to), counting only what has happened by `now`. Cigarettes never subtract anything. */
export function pointsBetween(data: JourneyData, from: number, to: number, now: number): number {
  const w = eventsBetween(data, from, to);
  let pts = w.cravings.filter((c) => c.beaten).length * POINTS.cravingHandled;
  pts += w.surfs.length * POINTS.surfCompleted;
  pts += w.lessons.length * POINTS.lessonRead;
  pts += data.plans.filter((p) => {
    const t = idTime(p.id);
    return t !== undefined && inRange(t, from, to);
  }).length * POINTS.planMade;
  // Full smoke-free days inside the range, counted once the day is over. The starting day is partial.
  const firstFullDay = addDays(startOfDay(data.startedAt), 1);
  for (let day = Math.max(firstFullDay, startOfDay(from)); ; day = addDays(day, 1)) {
    const end = addDays(day, 1);
    if (end > to || end > now) break;
    if (!data.smokes.some((s) => inRange(s.at, day, end))) pts += POINTS.smokeFreeDay;
  }
  const supportDays = new Map<string, number>();
  for (const s of data.supports) {
    if (!inRange(s.at, from, to)) continue;
    supportDays.set(dayKey(s.at), Math.min(POINTS.supportPerDayCap, (supportDays.get(dayKey(s.at)) ?? 0) + 1));
  }
  for (const count of supportDays.values()) pts += count * POINTS.supportGiven;
  for (const s of completedChallenges(data)) {
    if (s.completedAt !== undefined && inRange(s.completedAt, from, to)) pts += POINTS.challenge[s.def.level];
  }
  return pts;
}

// ---------- personal bests and the personal league ----------

export interface WeekScore {
  week: string;
  points: number;
}

/** Points per week for the last `count` weeks (oldest first, this week last), never before starting. */
export function weeklyPoints(data: JourneyData, now: number, count = 8): WeekScore[] {
  const out: WeekScore[] = [];
  const first = weekStart(data.startedAt);
  for (let i = count - 1; i >= 0; i--) {
    const from = addDays(weekStart(now), -7 * i);
    if (from < first) continue;
    out.push({ week: dayKey(from), points: pointsBetween(data, from, addDays(from, 7), now) });
  }
  return out;
}

/**
 * Like `weeklyPoints`, but each past week counted only up to the same moment of the week as `now`.
 * This week is unfinished, so ranking it against whole weeks would put it last every Monday.
 */
export function weeklyPointsSoFar(data: JourneyData, now: number, count = 8): WeekScore[] {
  const elapsed = now - weekStart(now);
  const first = weekStart(data.startedAt);
  const out: WeekScore[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const from = addDays(weekStart(now), -7 * i);
    if (from < first) continue;
    out.push({ week: dayKey(from), points: pointsBetween(data, from, from + elapsed, now) });
  }
  return out;
}

/** Where this week ranks among the member's own recent weeks (1 = best). */
export function personalRank(weeks: WeekScore[]): { rank: number; of: number } | undefined {
  if (weeks.length < 2) return undefined;
  const current = weeks[weeks.length - 1].points;
  return { rank: 1 + weeks.filter((w) => w.points > current).length, of: weeks.length };
}

export interface PersonalBests {
  /** Most cravings handled (beaten or surfed) in one week. */
  bestWeekCravings: number;
  lessonsRead: number;
  surfsCompleted: number;
  /** Consecutive days, up to today, with a healthy action. 0 is fine: nothing is "lost". */
  currentActiveStreak: number;
  bestActiveStreak: number;
}

export function personalBests(data: JourneyData, now: number): PersonalBests {
  const handledTimes = [...data.cravings.filter((c) => c.beaten).map((c) => c.at), ...data.surfs.map((s) => s.at)];
  const perWeek = new Map<string, number>();
  for (const t of handledTimes) perWeek.set(weekKey(t), (perWeek.get(weekKey(t)) ?? 0) + 1);

  const active = new Set([...handledTimes, ...data.lessons.map((l) => l.at)].map(dayKey));
  let best = 0;
  let run = 0;
  for (let day = startOfDay(data.startedAt); day <= startOfDay(now); day = addDays(day, 1)) {
    run = active.has(dayKey(day)) ? run + 1 : 0;
    best = Math.max(best, run);
  }
  // Current streak: today counts if active; otherwise yesterday's run still stands until today ends.
  let current = 0;
  let day = active.has(dayKey(now)) ? startOfDay(now) : addDays(startOfDay(now), -1);
  while (day >= startOfDay(data.startedAt) && active.has(dayKey(day))) {
    current++;
    day = addDays(day, -1);
  }

  return {
    bestWeekCravings: Math.max(0, ...perWeek.values()),
    lessonsRead: data.lessons.length,
    surfsCompleted: data.surfs.length,
    currentActiveStreak: current,
    bestActiveStreak: best,
  };
}
