import type { Lang, Messages } from '@/i18n';

import { formatShortDate } from './date';

/** "5 min ago", from the server's timestamp; a date once it is a week old. */
export function timeAgo(iso: string, t: Messages, lang: Lang, now = Date.now()): string {
  const then = new Date(iso);
  const mins = Math.max(0, Math.floor((now - then.getTime()) / 60_000));
  if (mins < 1) return t.community.ago.now;
  if (mins < 60) return t.community.ago.minutes(mins);
  if (mins < 24 * 60) return t.community.ago.hours(Math.floor(mins / 60));
  const days = Math.floor(mins / (24 * 60));
  if (days < 7) return t.community.ago.days(days);
  // After a week a date reads better than "400 days ago".
  return formatShortDate(then.getTime(), lang, { now });
}

export { isolate } from './text';
