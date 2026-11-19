import { bestTool, type CravingRating, type RatedTool } from './ratings';

/**
 * The guide: a companion that stays with the member through every SOS tool, with a short line
 * before, during and after. Support only, never instructions or medical claims, and never shaming.
 * Pure functions; the component picks the words.
 */
export type GuidePhase = 'before' | 'start' | 'half' | 'end' | 'after' | 'endedEarly';

/** Where the member is in a tool. `total` is the tool's full length; `ended` means "Done" was tapped early. */
export function guidePhase({ started, elapsed, total, done, ended }: { started: boolean; elapsed: number; total: number; done: boolean; ended?: boolean }): GuidePhase {
  if (!started) return 'before';
  if (done) return ended ? 'endedEarly' : 'after';
  const share = total > 0 ? elapsed / total : 0;
  return share < 0.4 ? 'start' : share < 0.8 ? 'half' : 'end';
}

export type GuideLine =
  | { kind: 'before' | 'start' | 'half' | 'end' | 'after'; pick: number }
  | { kind: 'endedEarly' }
  | { kind: 'best' }
  | { kind: 'reason'; pick: number };

/**
 * The line for a phase. After a tool: "this one works for you" when it is the member's best tool,
 * otherwise every other time one of their own reasons, so the words stay personal without repeating.
 * `seed` (e.g. when the tool started) keeps the choice steady while the screen updates.
 */
export function guideLine(phase: GuidePhase, { tool, ratings, reasons, seed }: { tool: RatedTool; ratings: CravingRating[]; reasons: number; seed: number }): GuideLine {
  const pick = Math.abs(Math.floor(seed));
  if (phase === 'endedEarly') return { kind: 'endedEarly' };
  if (phase === 'after') {
    if (bestTool(ratings)?.tool === tool) return { kind: 'best' };
    if (reasons > 0 && pick % 2 === 0) return { kind: 'reason', pick: Math.floor(pick / 2) };
  }
  return { kind: phase, pick };
}
