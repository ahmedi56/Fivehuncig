/**
 * Personal craving ratings: "Craving now? 0–10" before and after an SOS tool, and 30 minutes later
 * "Did you smoke after that?". Kept on the phone only. Ranks the member's own tools by how much
 * their craving dropped, so the app can say which one works for *them* (docs/RESEARCH_QUIT_EVIDENCE.md,
 * "Cross-cutting measurement"). Pure functions; the store keeps the list.
 */

/**
 * SOS tools that ask for a rating. Water (one tap) and the chat (its own flow) don't.
 * `bubbles` stays for ratings saved before Bubble pop became Pattern Pop.
 */
export const RATED_TOOLS = ['delay', 'breathe', 'bubbles', 'memory', 'urge-surf', 'move', 'squeeze', 'blocks', 'pattern', 'imagery'] as const;
export type RatedTool = (typeof RATED_TOOLS)[number];

export function isRatedTool(value: unknown): value is RatedTool {
  return typeof value === 'string' && (RATED_TOOLS as readonly string[]).includes(value);
}

export interface CravingRating {
  id: string;
  tool: RatedTool;
  /** When the tool was finished. */
  at: number;
  /** Craving 0..10 before the tool; skipped if the member wanted to start straight away. */
  before?: number;
  /** Craving 0..10 after the tool. */
  after: number;
  /** Answer to the 30-minute follow-up; undefined until answered. */
  smokedAfter?: boolean;
  /** The scheduled follow-up notification, so answering in the app can cancel it. */
  followUpId?: string;
}

/** The follow-up is asked 30 minutes after the tool, and only for a day after that. */
export const FOLLOW_UP_DELAY = 30 * 60_000;
export const FOLLOW_UP_WINDOW = 24 * 3_600_000;
/** A tool needs this many before-and-after ratings before it can be called "your best". */
export const MIN_USES = 3;

/** A 0..10 craving score, or undefined for anything else (input from the UI or old data). */
export function cravingScore(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 10 ? value : undefined;
}

export interface ToolStats {
  tool: RatedTool;
  /** Ratings with both a before and an after score. */
  uses: number;
  /** Average of before − after over those uses (positive = the craving went down). */
  averageDrop: number;
  /** Answered follow-ups and how many of them were "I smoked". */
  answered: number;
  smoked: number;
}

export function toolStats(ratings: CravingRating[]): ToolStats[] {
  return RATED_TOOLS.map((tool) => {
    const mine = ratings.filter((r) => r.tool === tool);
    const paired = mine.filter((r) => r.before !== undefined);
    const drop = paired.reduce((sum, r) => sum + (r.before! - r.after), 0);
    const answered = mine.filter((r) => r.smokedAfter !== undefined);
    return {
      tool,
      uses: paired.length,
      averageDrop: paired.length ? drop / paired.length : 0,
      answered: answered.length,
      smoked: answered.filter((r) => r.smokedAfter).length,
    };
  });
}

/**
 * The member's best tool: the largest average drop among tools used at least MIN_USES times.
 * Undefined until there is one with a real drop; ties go to the tool used more often.
 */
export function bestTool(ratings: CravingRating[]): ToolStats | undefined {
  return toolStats(ratings)
    .filter((s) => s.uses >= MIN_USES && s.averageDrop > 0)
    .sort((a, b) => b.averageDrop - a.averageDrop || b.uses - a.uses)[0];
}

/** The SOS screen shows this many tools; the rest wait behind "Other tools". */
export const SOS_SLOTS = 3;

/**
 * Orders the SOS tools: the member's best tool first (once it has MIN_USES rated uses), then the
 * default order, with tools that showed no drop after MIN_USES uses moved to the end.
 */
export function orderTools<T extends RatedTool>(defaults: readonly T[], ratings: CravingRating[]): T[] {
  const stats = new Map(toolStats(ratings).map((s) => [s.tool, s]));
  const best = bestTool(ratings)?.tool;
  const noDrop = (tool: T) => {
    const s = stats.get(tool);
    return !!s && s.uses >= MIN_USES && s.averageDrop <= 0;
  };
  const first = defaults.filter((tool) => tool === best);
  const rest = defaults.filter((tool) => tool !== best);
  return [...first, ...rest.filter((tool) => !noDrop(tool)), ...rest.filter(noDrop)];
}

/** Ratings whose follow-up question is due now: 30 minutes on, unanswered, less than a day old. Oldest first. */
export function dueFollowUps(ratings: CravingRating[], now: number): CravingRating[] {
  return ratings
    .filter((r) => r.smokedAfter === undefined && now - r.at >= FOLLOW_UP_DELAY && now - r.at < FOLLOW_UP_DELAY + FOLLOW_UP_WINDOW)
    .sort((a, b) => a.at - b.at);
}

/** Average drop to one decimal, for display ("−4.1"). */
export function roundDrop(drop: number): number {
  return Math.round(drop * 10) / 10;
}
