import { fitsDailyLimit, REMINDER_TIMES } from '@/domain/notify';
import { nextDailyTimes, progressAt } from '@/domain/reminder';
import { formatMoney } from '@/domain/stats';
import { FOLLOW_UP_DELAY, type CravingRating, type RatedTool } from '@/domain/ratings';
import { nextAllowedAt } from '@/domain/schedule';
import type { CravingTool, Mode, SmokeEvent, TriggerId } from '@/domain/types';
import { formatNumber, getLang, getT } from '@/i18n';
import { useAppStore } from '@/store/app-store';

import { cancel, scheduleFollowUp, scheduleReminderAt, scheduleTimerDone } from './notifications';

/**
 * User actions that touch both saved data and scheduled notifications.
 * Every screen goes through these, so the "timer done" reminder can never get out of sync
 * with what the user logged or which mode they are in.
 */

/** Logs a cigarette now. In cut-down mode, moves the "timer done" reminder to the new allowed time. */
export async function recordSmoke(trigger?: TriggerId): Promise<SmokeEvent> {
  const event = useAppStore.getState().logSmoke(Date.now(), trigger);
  if (useAppStore.getState().profile?.mode === 'cutdown') await rescheduleTimer();
  // The evening message's day count and money change with every cigarette.
  if (useAppStore.getState().showReminderProgress) await syncReminder();
  return event;
}

/**
 * The one-tap craving's answer: "I made it" or "I smoked". No rating, no questions. A cigarette is
 * logged like any other (the cut-down timer moves); slip rescue is the screen's job in quit mode.
 */
export async function finishCraving(beaten: boolean, tool: CravingTool): Promise<SmokeEvent | undefined> {
  useAppStore.getState().logCraving(beaten, tool, Date.now());
  return beaten ? undefined : recordSmoke();
}

/** Removes a cigarette logged by mistake and puts the reminder back where it belongs. */
export async function undoSmoke(id: string): Promise<void> {
  useAppStore.getState().undoSmoke(id);
  if (useAppStore.getState().profile?.mode === 'cutdown') await rescheduleTimer();
  if (useAppStore.getState().showReminderProgress) await syncReminder();
}

/**
 * Saves "Craving now?" ratings for an SOS tool and schedules the 30-minute "Did you smoke after
 * that?" follow-up. Without notifications the app asks the same question on Today instead.
 */
export async function recordRating(tool: RatedTool, after: number, before?: number, now = Date.now()): Promise<CravingRating> {
  const rating = useAppStore.getState().addRating({ tool, at: now, after, ...(before !== undefined ? { before } : {}) });
  if (!roomFor(now + FOLLOW_UP_DELAY)) return rating;
  const t = getT().ratings;
  const followUpId = await scheduleFollowUp(now + FOLLOW_UP_DELAY, { title: t.followUpTitle, body: t.followUpBody }, `/follow-up?id=${rating.id}`);
  if (followUpId) {
    useAppStore.getState().setRatingFollowUp(rating.id, followUpId);
    useAppStore.getState().noteScheduled(now + FOLLOW_UP_DELAY, now);
  }
  return rating;
}

/** Records the follow-up answer; a notification still waiting to fire is no longer needed. */
export async function answerFollowUp(id: string, smokedAfter: boolean): Promise<void> {
  const rating = useAppStore.getState().ratings.find((r) => r.id === id);
  if (!rating) return;
  useAppStore.getState().answerFollowUp(id, smokedAfter);
  await cancel(rating.followUpId);
}

/** Switches approach. Leaving cut-down mode cancels the "you can smoke now" reminder. */
export async function changeMode(mode: Mode): Promise<void> {
  useAppStore.getState().setMode(mode);
  if (mode === 'cutdown') await rescheduleTimer();
  else await clearTimer();
  if (useAppStore.getState().showReminderProgress) await syncReminder();
}

async function rescheduleTimer(): Promise<void> {
  await clearTimer();
  const { profile, smokes, setTimerNotificationId } = useAppStore.getState();
  const at = profile ? nextAllowedAt(profile, smokes, Date.now()) : undefined;
  if (!at || !roomFor(at)) return setTimerNotificationId(undefined);
  const t = getT().notifications;
  const id = await scheduleTimerDone(at, { title: t.timerTitle, body: t.timerBody });
  setTimerNotificationId(id);
  if (id) useAppStore.getState().noteScheduled(at);
}

/**
 * Whether a one-off notification may fire at `at`: not muted, and the day still has room under the
 * 2-a-day limit. Without it the app still asks in place (the follow-up card on Today).
 */
function roomFor(at: number): boolean {
  const { notificationsMuted, scheduledNotifications, reminder } = useAppStore.getState();
  return !notificationsMuted && fitsDailyLimit(scheduledNotifications ?? [], at, !!reminder);
}

/**
 * Puts the daily reminder ("the evening message") in line with Settings: one per day for the next
 * days, at the time the member picked, with the "Breathe now" button. Its words are neutral unless
 * the member chose to show their progress (day count and money kept). Also cancels reminders from
 * older versions. Safe to call any time: on start, after a cigarette, or when a setting changes.
 */
export async function syncReminder(now = Date.now()): Promise<void> {
  const store = useAppStore.getState();
  for (const id of store.staleNotificationIds ?? []) await cancel(id);
  if (store.staleNotificationIds) store.clearStaleNotifications();
  for (const id of store.reminderIds ?? []) await cancel(id);
  store.setReminderIds(undefined);
  const { reminder, notificationsMuted, profile, smokes, showReminderProgress } = useAppStore.getState();
  const time = REMINDER_TIMES.find((x) => x.key === reminder);
  if (!time || !profile || notificationsMuted) return;
  const t = getT().notifications;
  const lang = getLang();
  const ids: string[] = [];
  for (const at of nextDailyTimes(now, time.hour, time.minute)) {
    const progress = showReminderProgress ? progressAt(profile, smokes, at, now) : undefined;
    const body = progress ? t.progressBody(progress.day, formatMoney(progress.kept, profile.currency, (x) => formatNumber(x, lang))) : t.planBody;
    const id = await scheduleReminderAt(at, { title: t.planTitle, body });
    // No permission (or no notifications on this device): nothing more to set.
    if (!id) break;
    ids.push(id);
  }
  useAppStore.getState().setReminderIds(ids.length ? ids : undefined);
}

/** One tap: mute stops every scheduled notification; unmute brings the daily reminder back. */
export async function setNotificationsMuted(muted: boolean): Promise<void> {
  const store = useAppStore.getState();
  store.setNotificationsMuted(muted);
  if (muted) {
    await clearTimer();
    for (const r of store.ratings) if (r.followUpId && r.smokedAfter === undefined) await cancel(r.followUpId);
  } else if (store.profile?.mode === 'cutdown') await rescheduleTimer();
  await syncReminder();
}

async function clearTimer(): Promise<void> {
  const { timerNotificationId, setTimerNotificationId } = useAppStore.getState();
  if (!timerNotificationId) return;
  await cancel(timerNotificationId);
  setTimerNotificationId(undefined);
}
