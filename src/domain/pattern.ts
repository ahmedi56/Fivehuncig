/**
 * Pattern Pop (replaces Bubble pop): watch a short sequence light up, then pop it back in order.
 * Remembering the sequence loads working memory, which plain popping did not (docs/RESEARCH_QUIT_EVIDENCE.md,
 * section 3). The length adapts: one longer after a success, one shorter after a miss.
 */

export const BUBBLES = 9;
export const PATTERN_MS = 3 * 60_000;
export const START_LENGTH = 3;
export const MIN_LENGTH = 2;
export const MAX_LENGTH = 9;

export type Random = () => number;

/** A sequence of bubble indexes with no bubble repeated straight after itself (a repeat can't be seen). */
export function newSequence(length: number, random: Random = Math.random): number[] {
  const seq: number[] = [];
  while (seq.length < length) {
    const next = Math.floor(random() * BUBBLES);
    if (next !== seq[seq.length - 1]) seq.push(next);
  }
  return seq;
}

export interface PatternRound {
  sequence: number[];
  /** How many of the sequence have been popped correctly so far. */
  popped: number;
}

export type TapResult = 'continue' | 'done' | 'miss';

export function tapBubble(round: PatternRound, bubble: number): { round: PatternRound; result: TapResult } {
  if (bubble !== round.sequence[round.popped]) return { round, result: 'miss' };
  const popped = round.popped + 1;
  return { round: { ...round, popped }, result: popped === round.sequence.length ? 'done' : 'continue' };
}

/** The next round's length after a round that ended in `result`. */
export function nextLength(length: number, result: 'done' | 'miss'): number {
  return Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, length + (result === 'done' ? 1 : -1)));
}
