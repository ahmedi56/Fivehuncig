import { guideLine, guidePhase } from './guide';
import type { CravingRating } from './ratings';

const rating = (tool: CravingRating['tool'], before: number, after: number, i: number): CravingRating => ({ id: `r${tool}${i}`, tool, at: i, before, after });

describe('guide', () => {
  it('follows the member through a tool', () => {
    const at = (elapsed: number, more: Partial<Parameters<typeof guidePhase>[0]> = {}) => guidePhase({ started: true, elapsed, total: 100, done: false, ...more });
    expect(guidePhase({ started: false, elapsed: 0, total: 100, done: false })).toBe('before');
    expect([at(0), at(39), at(40), at(79), at(80)]).toEqual(['start', 'start', 'half', 'half', 'end']);
    expect(at(100, { done: true })).toBe('after');
    expect(at(20, { done: true, ended: true })).toBe('endedEarly');
  });

  it('says a tool works for the member only when it is their best', () => {
    const three = [0, 1, 2].map((i) => rating('squeeze', 8, 3, i));
    expect(guideLine('after', { tool: 'squeeze', ratings: three, reasons: 2, seed: 4 })).toEqual({ kind: 'best' });
    expect(guideLine('after', { tool: 'move', ratings: three, reasons: 0, seed: 4 })).toEqual({ kind: 'after', pick: 4 });
  });

  it('brings in one of their reasons every other time', () => {
    expect(guideLine('after', { tool: 'move', ratings: [], reasons: 3, seed: 6 })).toEqual({ kind: 'reason', pick: 3 });
    expect(guideLine('after', { tool: 'move', ratings: [], reasons: 3, seed: 7 })).toEqual({ kind: 'after', pick: 7 });
    expect(guideLine('half', { tool: 'move', ratings: [], reasons: 3, seed: 6 })).toEqual({ kind: 'half', pick: 6 });
    expect(guideLine('endedEarly', { tool: 'move', ratings: [], reasons: 3, seed: 6 })).toEqual({ kind: 'endedEarly' });
  });
});
