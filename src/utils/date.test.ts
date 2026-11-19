import { formatShortDate } from './date';

const NOW = new Date('2026-10-22T12:00:00').getTime();

describe('formatShortDate', () => {
  it('adds the year only for other years, unless asked', () => {
    expect(formatShortDate(new Date('2026-09-25T12:00:00').getTime(), 'en', { now: NOW })).not.toMatch(/2026/);
    expect(formatShortDate(new Date('2025-09-25T12:00:00').getTime(), 'en', { now: NOW })).toMatch(/2025/);
    expect(formatShortDate(new Date('2026-09-25T12:00:00').getTime(), 'en', { now: NOW, year: true })).toMatch(/2026/);
  });

  it('uses Latin digits in Arabic', () => {
    expect(formatShortDate(new Date('2025-09-25T12:00:00').getTime(), 'ar', { now: NOW })).toMatch(/25.*2025/);
  });
});
