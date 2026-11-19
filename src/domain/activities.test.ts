import {
  IMAGERY_MS,
  imageryPrompt,
  memoryPairs,
  MOVE_MS,
  moveCue,
  SQUEEZE_MS,
  SQUEEZE_ROUTINE,
  stepAt,
} from './activities';

const S = 1000;
const M = 60 * S;

describe('Move it', () => {
  it('changes cue once a minute over 5 minutes', () => {
    expect(MOVE_MS).toBe(5 * M);
    expect([0, M - 1, M, 2 * M, 3 * M, 4 * M + 59 * S, 9 * M].map(moveCue)).toEqual(['start', 'start', 'pace', 'arms', 'halfway', 'last', 'last']);
    expect(moveCue(-5)).toBe('start');
  });
});

describe('Squeeze', () => {
  it('fills exactly 3 minutes and never ends on a rest', () => {
    expect(SQUEEZE_ROUTINE.reduce((sum, s) => sum + s.ms, 0)).toBe(SQUEEZE_MS);
    expect(SQUEEZE_ROUTINE[SQUEEZE_ROUTINE.length - 1].kind).toBe('move');
    expect(SQUEEZE_ROUTINE[0]).toEqual({ kind: 'move', move: 'hands', ms: 20 * S });
  });

  it('finds the current step and the time left in it', () => {
    expect(stepAt(SQUEEZE_ROUTINE, 0)).toMatchObject({ index: 0, leftMs: 20 * S, done: false });
    expect(stepAt(SQUEEZE_ROUTINE, 25 * S)).toMatchObject({ index: 1, leftMs: 5 * S });
    expect(stepAt(SQUEEZE_ROUTINE, 31 * S).step).toMatchObject({ kind: 'move', move: 'legs' });
    expect(stepAt(SQUEEZE_ROUTINE, SQUEEZE_MS)).toMatchObject({ done: true, leftMs: 0 });
  });
});

describe('Vivid Escape', () => {
  it('walks six prompts over 2 minutes', () => {
    expect(IMAGERY_MS).toBe(2 * M);
    expect(imageryPrompt(0)).toEqual({ prompt: 'place', index: 0, done: false });
    expect(imageryPrompt(41 * S)).toMatchObject({ prompt: 'sounds', index: 2 });
    expect(imageryPrompt(IMAGERY_MS)).toMatchObject({ prompt: 'people', done: true });
  });
});

describe('Memory match', () => {
  it('grows from 6 to 10 pairs as boards are solved', () => {
    expect([0, 1, 2, 3, 9, -1].map(memoryPairs)).toEqual([6, 8, 10, 10, 10, 6]);
  });
});
