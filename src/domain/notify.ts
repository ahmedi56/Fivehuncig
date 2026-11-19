import { dayKey, DAY } from './time';

/**
 * Notification limits: at most 2 a day in total, a daily reminder only at a time the member picks,
 * and one-off notifications (the 30-minute follow-up, the cut-down timer) only while there is room
 * left that day. Nothing here may shame or count missed days. Pure functions; the store keeps the log.
 */
export const MAX_PER_DAY = 2;

/** The daily reminder times the member can pick from (local time). */
export const REMINDER_TIMES = [
  { key: 'morning', hour: 7, minute: 30 },
  { key: 'lunch', hour: 13, minute: 0 },
  { key: 'evening', hour: 18, minute: 30 },
] as const;
export type ReminderKey = (typeof REMINDER_TIMES)[number]['key'];

export function isReminderKey(value: unknown): value is ReminderKey {
  return REMINDER_TIMES.some((x) => x.key === value);
}

/** The preset closest to an old per-plan reminder time, for data saved before the single reminder. */
export function nearestReminder(hour: number, minute = 0): ReminderKey {
  const at = hour * 60 + minute;
  return REMINDER_TIMES.reduce((best, x) => (Math.abs(x.hour * 60 + x.minute - at) < Math.abs(best.hour * 60 + best.minute - at) ? x : best)).key;
}

/**
 * Whether one more one-off notification fits on the day of `at`, given the one-offs already
 * scheduled (their fire times) and whether a daily reminder takes one of the day's places.
 */
export function fitsDailyLimit(scheduled: readonly number[], at: number, dailyReminder: boolean): boolean {
  const day = dayKey(at);
  const used = scheduled.filter((x) => dayKey(x) === day).length + (dailyReminder ? 1 : 0);
  return used < MAX_PER_DAY;
}

/** Drops fire times older than a day: only today's and future ones can still count. */
export function pruneScheduled(scheduled: readonly number[], now: number): number[] {
  return scheduled.filter((x) => x > now - DAY);
}
