import { fitsDailyLimit, isReminderKey, MAX_PER_DAY, nearestReminder, pruneScheduled } from './notify';

const day = (h: number, m = 0, d = 24) => new Date(2026, 9, d, h, m).getTime();

describe('notification limits', () => {
  it('allows at most two a day, counting the daily reminder', () => {
    expect(MAX_PER_DAY).toBe(2);
    expect(fitsDailyLimit([], day(10), false)).toBe(true);
    expect(fitsDailyLimit([day(9)], day(10), false)).toBe(true);
    expect(fitsDailyLimit([day(9), day(11)], day(12), false)).toBe(false);
    // With a daily reminder, only one more fits.
    expect(fitsDailyLimit([], day(10), true)).toBe(true);
    expect(fitsDailyLimit([day(9)], day(10), true)).toBe(false);
  });

  it('counts each day on its own', () => {
    expect(fitsDailyLimit([day(9, 0, 23), day(22, 0, 23)], day(8), false)).toBe(true);
    // A follow-up set for just after midnight counts for the next day.
    expect(fitsDailyLimit([day(9), day(0, 10, 25)], day(23), false)).toBe(true);
  });

  it('keeps only fire times from the last day on', () => {
    expect(pruneScheduled([day(9, 0, 22), day(9, 0, 24), day(20)], day(12))).toEqual([day(9, 0, 24), day(20)]);
  });

  it('maps an old per-plan time to the nearest preset', () => {
    expect(nearestReminder(7, 30)).toBe('morning');
    expect(nearestReminder(12)).toBe('lunch');
    expect(nearestReminder(21, 15)).toBe('evening');
    expect(isReminderKey('lunch')).toBe(true);
    expect(isReminderKey('noon')).toBe(false);
  });
});
