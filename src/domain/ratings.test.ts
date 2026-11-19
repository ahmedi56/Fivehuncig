import {
  bestTool,
  cravingScore,
  dueFollowUps,
  FOLLOW_UP_DELAY,
  FOLLOW_UP_WINDOW,
  isRatedTool,
  orderTools,
  roundDrop,
  toolStats,
  type CravingRating,
} from './ratings';

const NOW = new Date(2026, 9, 24, 18, 0).getTime();
let n = 0;
const rating = (over: Partial<CravingRating> = {}): CravingRating => ({ id: `r${n++}`, tool: 'breathe', at: NOW, before: 8, after: 4, ...over });

describe('craving ratings', () => {
  it('accepts only whole scores from 0 to 10 and known tools', () => {
    expect([0, 10, 5].map(cravingScore)).toEqual([0, 10, 5]);
    expect([-1, 11, 4.5, '7', undefined].map(cravingScore)).toEqual([undefined, undefined, undefined, undefined, undefined]);
    expect(isRatedTool('memory')).toBe(true);
    expect(isRatedTool('water')).toBe(false);
  });

  it('averages the drop only over ratings with a before score', () => {
    const stats = toolStats([rating({ before: 8, after: 4 }), rating({ before: 6, after: 5 }), rating({ before: undefined, after: 0 })]);
    const breathe = stats.find((s) => s.tool === 'breathe')!;
    expect(breathe.uses).toBe(2);
    expect(breathe.averageDrop).toBe(2.5);
    expect(stats.find((s) => s.tool === 'memory')).toMatchObject({ uses: 0, averageDrop: 0 });
  });

  it('counts answered follow-ups and slips per tool', () => {
    const s = toolStats([rating({ smokedAfter: false }), rating({ smokedAfter: true }), rating()]).find((x) => x.tool === 'breathe')!;
    expect([s.answered, s.smoked]).toEqual([2, 1]);
  });

  it('names a best tool only after enough uses, and only with a real drop', () => {
    expect(bestTool([rating({ tool: 'memory', before: 9, after: 1 })])).toBeUndefined();
    expect(bestTool([rating({ before: 5, after: 5 }), rating({ before: 5, after: 6 })])).toBeUndefined();
    const best = bestTool([
      rating({ tool: 'breathe', before: 8, after: 6 }),
      rating({ tool: 'breathe', before: 8, after: 6 }),
      rating({ tool: 'urge-surf', before: 9, after: 4 }),
      rating({ tool: 'urge-surf', before: 7, after: 3 }),
    ]);
    // Two uses are not enough yet.
    expect(best).toBeUndefined();
    const third = bestTool([
      rating({ tool: 'breathe', before: 8, after: 6 }),
      rating({ tool: 'urge-surf', before: 9, after: 4 }),
      rating({ tool: 'urge-surf', before: 7, after: 3 }),
      rating({ tool: 'urge-surf', before: 8, after: 3.5 }),
    ]);
    expect(third).toMatchObject({ tool: 'urge-surf', uses: 3, averageDrop: 4.5 });
  });

  it('breaks a tie by the tool used more often', () => {
    const best = bestTool([
      rating({ tool: 'memory', before: 6, after: 3 }),
      rating({ tool: 'memory', before: 6, after: 3 }),
      rating({ tool: 'memory', before: 6, after: 3 }),
      rating({ tool: 'delay', before: 6, after: 3 }),
      rating({ tool: 'delay', before: 6, after: 3 }),
      rating({ tool: 'delay', before: 6, after: 3 }),
    ]);
    expect(best?.tool).toBe('delay');
  });

  it('puts the best tool first on SOS and moves tools that did not help to the end', () => {
    const defaults = ['move', 'squeeze', 'breathe', 'blocks', 'memory'] as const;
    expect(orderTools(defaults, [])).toEqual(defaults);
    const three = (tool: CravingRating['tool'], before: number, after: number) => [1, 2, 3].map(() => rating({ tool, before, after }));
    // Squeeze showed no drop in three uses; Memory dropped the most.
    const ratings = [...three('squeeze', 6, 6), ...three('memory', 8, 3), ...three('move', 7, 5)];
    expect(orderTools(defaults, ratings)).toEqual(['memory', 'move', 'breathe', 'blocks', 'squeeze']);
    // Two uses without a drop are not enough to move a tool down.
    expect(orderTools(defaults, three('move', 5, 5).slice(0, 2))).toEqual(defaults);
  });

  it('asks the follow-up from 30 minutes on, for a day, until answered', () => {
    const early = rating({ at: NOW - FOLLOW_UP_DELAY + 1 });
    const due = rating({ at: NOW - FOLLOW_UP_DELAY });
    const older = rating({ at: NOW - 2 * FOLLOW_UP_DELAY });
    const answered = rating({ at: NOW - FOLLOW_UP_DELAY, smokedAfter: false });
    const stale = rating({ at: NOW - FOLLOW_UP_DELAY - FOLLOW_UP_WINDOW });
    expect(dueFollowUps([early, due, older, answered, stale], NOW).map((r) => r.id)).toEqual([older.id, due.id]);
  });

  it('rounds the drop to one decimal', () => {
    expect(roundDrop(4.0833)).toBe(4.1);
    expect(roundDrop(2)).toBe(2);
  });
});
