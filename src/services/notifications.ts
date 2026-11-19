import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

/**
 * Local notifications only — nothing is sent to a server.
 * Every function fails soft: if notifications are unavailable or denied,
 * the app keeps working and simply shows the timer on screen.
 *
 * `expo-notifications` is loaded lazily, never at module scope. Importing it
 * runs push-token side effects that throw on Android in Expo Go (SDK 53+) and
 * warn during web static rendering — which used to break every route that
 * imported this file. Android in Expo Go therefore runs without reminders;
 * use a development build to test them there.
 */

type NotificationsModule = typeof import('expo-notifications');

const supported = Platform.OS === 'ios' || (Platform.OS === 'android' && !isRunningInExpoGo());

let loading: Promise<NotificationsModule | undefined> | undefined;

function load(): Promise<NotificationsModule | undefined> {
  if (!supported) return Promise.resolve(undefined);
  loading ??= import('expo-notifications').catch(() => undefined);
  return loading;
}

/**
 * The "Breathe now" button on reminders: one tap on the notification starts the one-tap breathing,
 * without looking for the app first. (Category ids may not contain ":" or "-".)
 */
const CRAVING_CATEGORY = 'craving';
const BREATHE_ACTION = 'breathe';
export const BREATHE_URL = '/breathe?quick=1';

/** The button itself, as `setNotificationCategoryAsync` takes it. */
export function breatheActions(label: string) {
  return [{ identifier: BREATHE_ACTION, buttonTitle: label, options: { opensAppToForeground: true } }];
}

/** Reminder content with the "Breathe now" button attached. */
export function withBreatheButton<T extends object>(content: T): T & { categoryIdentifier: string } {
  return { ...content, categoryIdentifier: CRAVING_CATEGORY };
}

interface TappedResponse {
  actionIdentifier: string;
  notification: { request: { content: { data?: Record<string, unknown> | null } } };
}

/**
 * The in-app address for a tapped notification: "Breathe now" opens the one-tap breathing, a tap
 * on the notification itself opens its own address. `defaultAction` is the library's id for that tap.
 */
export function urlForResponse(r: TappedResponse | null, defaultAction: string): string | undefined {
  if (!r) return undefined;
  if (r.actionIdentifier === BREATHE_ACTION) return BREATHE_URL;
  if (r.actionIdentifier !== defaultAction) return undefined;
  const url = r.notification.request.content.data?.url;
  return typeof url === 'string' ? url : undefined;
}

/** Translated text for a notification; callers pass it in so this module stays free of UI state. */
export interface NotificationText {
  title: string;
  body: string;
}

/**
 * `channelName` is the user-visible name of the Android notification channel; `breatheLabel` the
 * translated "Breathe now" button shown on reminders.
 */
export async function configureNotifications(channelName: string, breatheLabel?: string): Promise<void> {
  const Notifications = await load();
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: channelName,
      importance: Notifications.AndroidImportance.DEFAULT,
    }).catch(() => undefined);
  }
  if (breatheLabel) {
    await Notifications.setNotificationCategoryAsync(CRAVING_CATEGORY, breatheActions(breatheLabel)).catch(() => undefined);
  }
}

export async function ensurePermission(): Promise<boolean> {
  const Notifications = await load();
  if (!Notifications) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

export async function cancel(id?: string): Promise<void> {
  if (!id) return;
  const Notifications = await load();
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Already fired or removed — nothing to do.
  }
}

/** "Your next cigarette is allowed" — only if permission was already granted. */
export async function scheduleTimerDone(at: number, content: NotificationText): Promise<string | undefined> {
  if (at <= Date.now()) return undefined;
  const Notifications = await load();
  if (!Notifications) return undefined;
  try {
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) return undefined;
    return await Notifications.scheduleNotificationAsync({
      content: withBreatheButton(content),
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at), channelId: 'reminders' },
    });
  } catch {
    return undefined;
  }
}

/**
 * "Did you smoke after that craving?" 30 minutes after an SOS tool. Carries the in-app address to
 * open when tapped. Only if permission was already granted: the app also asks the question itself.
 */
export async function scheduleFollowUp(at: number, content: NotificationText, url: string): Promise<string | undefined> {
  if (at <= Date.now()) return undefined;
  const Notifications = await load();
  if (!Notifications) return undefined;
  try {
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) return undefined;
    return await Notifications.scheduleNotificationAsync({
      content: { ...content, data: { url } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at), channelId: 'reminders' },
    });
  } catch {
    return undefined;
  }
}

/**
 * Calls `open` with the in-app address of a notification the member tapped: the one that launched
 * the app, then any tapped while it runs. Returns a function that stops listening.
 * The address is passed on as-is; the caller decides which addresses it accepts.
 */
export function onNotificationOpen(open: (url: string) => void): () => void {
  let stopped = false;
  let remove: (() => void) | undefined;
  load().then(async (Notifications) => {
    if (!Notifications || stopped) return;
    const urlOf = (r: TappedResponse | null) => urlForResponse(r, Notifications.DEFAULT_ACTION_IDENTIFIER);
    try {
      const first = urlOf(await Notifications.getLastNotificationResponseAsync());
      if (first && !stopped) open(first);
      const sub = Notifications.addNotificationResponseReceivedListener((r) => {
        const url = urlOf(r);
        if (url) open(url);
      });
      if (stopped) sub.remove();
      else remove = () => sub.remove();
    } catch {
      // Notifications unavailable: nothing to listen to.
    }
  });
  return () => {
    stopped = true;
    remove?.();
  };
}

/**
 * One day's reminder at a set moment (the daily reminder is set a few days ahead, one per day, so
 * its words can change). Asks for permission: the member chose this reminder in Settings.
 */
export async function scheduleReminderAt(at: number, content: NotificationText): Promise<string | undefined> {
  if (at <= Date.now()) return undefined;
  const Notifications = await load();
  if (!Notifications || !(await ensurePermission())) return undefined;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: withBreatheButton(content),
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at), channelId: 'reminders' },
    });
  } catch {
    return undefined;
  }
}

export async function cancelAll(): Promise<void> {
  const Notifications = await load();
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}

export const notificationsSupported = supported;
