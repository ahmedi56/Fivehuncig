/**
 * Timings and steps for the SOS activities. Pure, so the screens stay thin and the rules are tested.
 * Evidence and doses: docs/RESEARCH_QUIT_EVIDENCE.md, section 3 (acute craving tools).
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;

// ---------- Move it: a 5-minute brisk walk (or stairs), the strongest acute evidence ----------

export const MOVE_MS = 5 * MINUTE;
/** One cue per minute; the screen shows it and gives a light vibration when it changes. */
export const MOVE_CUES = ['start', 'pace', 'arms', 'halfway', 'last'] as const;
export type MoveCue = (typeof MOVE_CUES)[number];

export function moveCue(elapsedMs: number): MoveCue {
  const minute = Math.floor(Math.max(0, elapsedMs) / MINUTE);
  return MOVE_CUES[Math.min(MOVE_CUES.length - 1, minute)];
}

// ---------- Squeeze: a 3-minute isometric routine for when walking away isn't possible ----------

export const SQUEEZE_MS = 3 * MINUTE;
export const SQUEEZE_MOVES = ['hands', 'legs', 'push'] as const;
export type SqueezeMove = (typeof SQUEEZE_MOVES)[number];
export type SqueezeStep = { kind: 'move'; move: SqueezeMove; ms: number } | { kind: 'rest'; ms: number };

/** 20 s hands, 20 s legs, 30 s push, with 10 s rests, repeated to fill exactly 3 minutes. */
const CYCLE: SqueezeStep[] = [
  { kind: 'move', move: 'hands', ms: 20 * SECOND },
  { kind: 'rest', ms: 10 * SECOND },
  { kind: 'move', move: 'legs', ms: 20 * SECOND },
  { kind: 'rest', ms: 10 * SECOND },
  { kind: 'move', move: 'push', ms: 30 * SECOND },
  { kind: 'rest', ms: 10 * SECOND },
];

export const SQUEEZE_ROUTINE: SqueezeStep[] = (() => {
  const steps: SqueezeStep[] = [];
  let total = 0;
  for (let i = 0; total < SQUEEZE_MS; i++) {
    const step = CYCLE[i % CYCLE.length];
    const ms = Math.min(step.ms, SQUEEZE_MS - total);
    steps.push({ ...step, ms });
    total += ms;
  }
  // Never end on a rest: the last seconds belong to the move before it.
  const last = steps[steps.length - 1];
  if (last.kind === 'rest') {
    steps.pop();
    steps[steps.length - 1] = { ...steps[steps.length - 1], ms: steps[steps.length - 1].ms + last.ms };
  }
  return steps;
})();

export interface RoutinePosition<T> {
  step: T;
  index: number;
  /** Time left in this step. */
  leftMs: number;
  done: boolean;
}

/** Where `elapsedMs` falls in a list of timed steps. */
export function stepAt<T extends { ms: number }>(steps: T[], elapsedMs: number): RoutinePosition<T> {
  let start = 0;
  for (let i = 0; i < steps.length; i++) {
    const end = start + steps[i].ms;
    if (elapsedMs < end) return { step: steps[i], index: i, leftMs: end - Math.max(0, elapsedMs), done: false };
    start = end;
  }
  return { step: steps[steps.length - 1], index: steps.length - 1, leftMs: 0, done: true };
}

// ---------- Vivid Escape: 2 minutes of guided imagery that competes with craving imagery ----------

export const IMAGERY_SCENES = ['beach', 'meal', 'match'] as const;
export type ImageryScene = (typeof IMAGERY_SCENES)[number];
/** Six multisensory prompts, 20 seconds each. */
export const IMAGERY_PROMPTS = ['place', 'colours', 'sounds', 'smell', 'touch', 'people'] as const;
export type ImageryPrompt = (typeof IMAGERY_PROMPTS)[number];
export const IMAGERY_STEP_MS = 20 * SECOND;
export const IMAGERY_MS = IMAGERY_PROMPTS.length * IMAGERY_STEP_MS;

export function imageryPrompt(elapsedMs: number): { prompt: ImageryPrompt; index: number; done: boolean } {
  const index = Math.floor(Math.max(0, elapsedMs) / IMAGERY_STEP_MS);
  if (index >= IMAGERY_PROMPTS.length) return { prompt: IMAGERY_PROMPTS[IMAGERY_PROMPTS.length - 1], index: IMAGERY_PROMPTS.length - 1, done: true };
  return { prompt: IMAGERY_PROMPTS[index], index, done: false };
}

// ---------- Memory match: harder after each win so it keeps working memory busy, 3 minutes max ----------

export const MEMORY_MS = 3 * MINUTE;
export const MEMORY_PAIRS = [6, 8, 10] as const;

/** Pairs on the board after `wins` boards solved in this session. */
export function memoryPairs(wins: number): number {
  return MEMORY_PAIRS[Math.min(MEMORY_PAIRS.length - 1, Math.max(0, wins))];
}
