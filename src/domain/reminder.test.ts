import { nextDailyTimes, progressAt } from './reminder';
import type { Profile } from './types';

const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).getTime();
const profile = (mode: Profile['mode'], startedAt = at(20, 8)): Profile =>
  ({ mode, startedAt, cigsPerDay: 20, pricePerPack: 10, cigsPerPack: 20, currency: 'TND', wakeHours: 16 }) as Profile;

describe('daily reminder', () => {
  it('sets the next evenings, starting tomorrow once today’s time has passed', () => {
    expect(nextDailyTimes(at(29, 12), 18, 30, 3)).toEqual([at(29, 18, 30), at(30, 18, 30), at(31, 18, 30)]);
    expect(nextDailyTimes(at(29, 19), 18, 30, 2)).toEqual([at(30, 18, 30), at(31, 18, 30)]);
  });

  it('says the day and the money kept, and nothing in watch mode', () => {
    const quit = progressAt(profile('quit'), [], at(24, 18, 30), at(23, 12));
    expect(quit?.day).toBe(5);
    expect(quit!.kept).toBeGreaterThan(0);
    expect(progressAt(profile('watch'), [], at(24, 18), at(23, 12))).toBeUndefined();
  });

  it('counts the quit day from the last cigarette', () => {
    const p = profile('quit');
    expect(progressAt(p, [{ id: 's', at: at(22, 9) }], at(24, 18), at(23, 12))?.day).toBe(3);
  });

  it('in cut-down mode, never counts money for days that have not happened', () => {
    const p = profile('cutdown');
    const later = progressAt(p, [], at(28, 18), at(23, 12));
    const now = progressAt(p, [], at(23, 18), at(23, 12));
    expect(later?.kept).toBe(now?.kept);
  });
});
