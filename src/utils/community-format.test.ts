import ar from '@/i18n/ar';
import en from '@/i18n/en';

import { isolate, timeAgo } from './community-format';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const NOW = new Date('2026-10-22T12:00:00').getTime();
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const DAY = 86_400_000;

describe('timeAgo', () => {
  it('is relative for the first week', () => {
    expect(timeAgo(ago(30_000), en, 'en', NOW)).toBe('just now');
    expect(timeAgo(ago(6 * DAY), en, 'en', NOW)).toBe('6 days ago');
  });

  it('becomes a date after a week, with the year only when it differs', () => {
    expect(timeAgo(ago(8 * DAY), en, 'en', NOW)).not.toMatch(/ago|2026/);
    expect(timeAgo(ago(400 * DAY), en, 'en', NOW)).toMatch(/2025/);
    // Latin digits in Arabic, like the rest of the app.
    expect(timeAgo(ago(400 * DAY), ar, 'ar', NOW)).toMatch(/2025/);
  });
});

describe('isolate', () => {
  it('wraps a name in first-strong isolate marks', () => {
    expect(isolate('نور')).toBe('⁨نور⁩');
  });
});
