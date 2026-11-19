import { BUBBLES, MAX_LENGTH, MIN_LENGTH, newSequence, nextLength, tapBubble } from './pattern';

const seeded = (seed = 3) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

describe('Pattern Pop', () => {
  it('builds a sequence of valid bubbles with no bubble twice in a row', () => {
    const seq = newSequence(9, seeded());
    expect(seq).toHaveLength(9);
    expect(seq.every((b) => b >= 0 && b < BUBBLES)).toBe(true);
    expect(seq.every((b, i) => i === 0 || b !== seq[i - 1])).toBe(true);
  });

  it('counts correct pops and finishes the round on the last one', () => {
    let round = { sequence: [4, 1, 7], popped: 0 };
    let step = tapBubble(round, 4);
    expect(step.result).toBe('continue');
    round = step.round;
    round = tapBubble(round, 1).round;
    step = tapBubble(round, 7);
    expect(step.result).toBe('done');
    expect(step.round.popped).toBe(3);
  });

  it('a wrong bubble is a miss and changes nothing', () => {
    const round = { sequence: [4, 1, 7], popped: 1 };
    expect(tapBubble(round, 4)).toEqual({ round, result: 'miss' });
  });

  it('adapts the length within its limits', () => {
    expect(nextLength(3, 'done')).toBe(4);
    expect(nextLength(3, 'miss')).toBe(2);
    expect(nextLength(MIN_LENGTH, 'miss')).toBe(MIN_LENGTH);
    expect(nextLength(MAX_LENGTH, 'done')).toBe(MAX_LENGTH);
  });
});
