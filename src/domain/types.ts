/** How the user wants to use the app right now. Nobody is forced to set a quit date. */
export type Mode = 'watch' | 'cutdown' | 'quit';

export interface Profile {
  /** Cigarettes per day before starting (the baseline). */
  cigsPerDay: number;
  /** Price of one pack in the user's own currency. */
  pricePerPack: number;
  cigsPerPack: number;
  /** Free-text currency symbol, e.g. "₦", "$", "€". */
  currency: string;
  /** Awake hours per day — used to spread cigarettes across the day. */
  wakeHours: number;
  mode: Mode;
  /** When the user started with the app (ms epoch). */
  startedAt: number;
  /** When the cut-down plan started (ms epoch). */
  cutdownStartedAt?: number;
  /** When the user chose to fully quit (ms epoch). */
  quitAt?: number;
  /** How much longer the wait between cigarettes gets each week (0.1 = 10%). */
  weeklyStep: number;
}

/** What was going on right before a craving or a cigarette. Optional, one tap, never required. */
export const TRIGGERS = ['stress', 'coffee', 'alcohol', 'social', 'boredom', 'meal', 'work', 'other'] as const;
export type TriggerId = (typeof TRIGGERS)[number];

export function isTriggerId(value: unknown): value is TriggerId {
  return typeof value === 'string' && (TRIGGERS as readonly string[]).includes(value);
}

export interface SmokeEvent {
  id: string;
  at: number;
  /** Smoked before the Next Cigarette Timer allowed it. Never used to shame — only for stats. */
  early?: boolean;
  trigger?: TriggerId;
}

export interface CravingEvent {
  id: string;
  at: number;
  /** True if the user got through the craving without smoking. */
  beaten: boolean;
  tool?: CravingTool;
  trigger?: TriggerId;
}

export type CravingTool = 'delay' | 'breathe' | 'water' | 'game' | 'urge-surf' | 'plan' | 'chat' | 'move' | 'squeeze' | 'imagery';

export interface Plan {
  id: string;
  trigger: string;
  action: string;
  /** Optional daily reminder time (local). */
  hour?: number;
  minute?: number;
  notificationId?: string;
}

export interface Reason {
  id: string;
  text: string;
  photoUri?: string;
}

/** Where the member feels a craving (optional, step 1 of urge surfing). */
export const BODY_AREAS = ['chest', 'mouth', 'hands', 'stomach', 'head', 'elsewhere'] as const;
export type BodyArea = (typeof BODY_AREAS)[number];

export type CravingTrend = 'weaker' | 'same' | 'stronger';
export type Helped = 'yes' | 'little' | 'not-yet';

/** One finished guided urge-surfing exercise. Abandoned sessions are not stored. */
export interface UrgeSurfSession {
  id: string;
  /** When it was finished. */
  at: number;
  startedAt: number;
  bodyArea?: BodyArea;
  /** Craving strength 0..10 before and after, if the member rated it. */
  before?: number;
  after?: number;
  trend?: CravingTrend;
  helped?: Helped;
  /** "What did smoking actually feel like last time?" — the member's own words, optional. */
  reflection?: string;
}

/** A Learn article the member marked as read (once per article). */
export interface LessonRead {
  id: string;
  at: number;
}

/** The member replied to support someone else in the community (stored on the phone, for points and memories). */
export interface SupportGiven {
  id: string;
  at: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'advanced';

/** The member joined a weekly challenge. `week` is the local Monday, e.g. "2026-09-28". */
export interface ChallengeEntry {
  week: string;
  challengeId: string;
  joinedAt: number;
}
