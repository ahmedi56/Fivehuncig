export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;

/** Local midnight for the day containing `t`. */
export function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Local calendar key, e.g. "2026-10-01". */
export function dayKey(t: number): string {
  const d = new Date(t);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Adds whole local calendar days (DST-safe). */
export function addDays(t: number, days: number): number {
  const d = new Date(t);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

export interface DurationUnits {
  d: string;
  h: string;
  m: string;
  s: string;
}

const EN_UNITS: DurationUnits = { d: 'd', h: 'h', m: 'm', s: 's' };

/**
 * "2h 05m", "45m", "3d 4h", "128d", "1,284d" — short human duration. Pass translated `units`
 * (and the language's number formatter) for other languages.
 *
 * From 100 days on, hours are dropped: "128 ي 23 س" no longer fits the progress ring in Arabic,
 * and after 100 days the hours stop meaning much. Years/months were tried and are wider still.
 */
export function formatDuration(ms: number, units: DurationUnits = EN_UNITS, formatNumber: (n: number) => string = String): string {
  const safe = Math.max(0, ms);
  const days = Math.floor(safe / DAY);
  const hours = Math.floor((safe % DAY) / HOUR);
  const minutes = Math.floor((safe % HOUR) / MINUTE);
  if (days >= 100) return `${formatNumber(days)}${units.d}`;
  if (days > 0) return `${days}${units.d} ${hours}${units.h}`;
  if (hours > 0) return `${hours}${units.h} ${String(minutes).padStart(2, '0')}${units.m}`;
  if (minutes > 0) return `${minutes}${units.m}`;
  return `${Math.floor(safe / 1000)}${units.s}`;
}

/** "mm:ss" countdown. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
