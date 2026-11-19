import { useAppStore } from '@/store/app-store';

import { FOLLOW_UP_DELAY } from '@/domain/ratings';

import { answerFollowUp, changeMode, finishCraving, recordRating, recordSmoke, syncReminder, undoSmoke } from './actions';
import { cancel, scheduleFollowUp, scheduleReminderAt, scheduleTimerDone } from './notifications';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('./notifications', () => ({
  cancel: jest.fn(async () => undefined),
  scheduleTimerDone: jest.fn(async () => 'timer-1'),
  scheduleFollowUp: jest.fn(async () => 'follow-1'),
  scheduleReminderAt: jest.fn(async (at: number) => `rem-${at}`),
}));

const form = { cigsPerDay: 16, pricePerPack: 1000, cigsPerPack: 20, currency: '$', wakeHours: 16 };

beforeEach(() => {
  jest.clearAllMocks();
  useAppStore.getState().resetAll();
});

describe('actions keep the timer reminder in sync', () => {
  it('schedules the reminder after a cigarette in cut-down mode, with translated text', async () => {
    useAppStore.getState().setLanguage('fr');
    useAppStore.getState().completeOnboarding(form, 'cutdown');
    await recordSmoke('coffee');
    expect(scheduleTimerDone).toHaveBeenCalledWith(expect.any(Number), expect.objectContaining({ title: 'Mahla', body: 'Votre minuteur est terminé.' }));
    expect(useAppStore.getState().timerNotificationId).toBe('timer-1');
    expect(useAppStore.getState().smokes[0].trigger).toBe('coffee');
  });

  it('cancels the "you can smoke now" reminder when switching to quit mode', async () => {
    useAppStore.getState().completeOnboarding(form, 'cutdown');
    await recordSmoke();
    await changeMode('quit');
    expect(cancel).toHaveBeenCalledWith('timer-1');
    expect(useAppStore.getState().timerNotificationId).toBeUndefined();
    expect(useAppStore.getState().profile?.mode).toBe('quit');
  });

  it('moves the reminder back when a cigarette is undone', async () => {
    useAppStore.getState().completeOnboarding(form, 'cutdown');
    const event = await recordSmoke();
    jest.clearAllMocks();
    await undoSmoke(event.id);
    expect(cancel).toHaveBeenCalledWith('timer-1');
    expect(useAppStore.getState().smokes).toHaveLength(0);
  });

  it('never schedules the timer reminder outside cut-down mode', async () => {
    useAppStore.getState().completeOnboarding(form, 'quit');
    await recordSmoke();
    expect(scheduleTimerDone).not.toHaveBeenCalled();
  });
});

describe('craving ratings', () => {
  it('saves the rating and schedules the follow-up 30 minutes later, opening its own question with neutral words for the lock screen', async () => {
    useAppStore.getState().setLanguage('en');
    const now = Date.now();
    const rating = await recordRating('breathe', 3, 8, now);
    expect(useAppStore.getState().ratings[0]).toMatchObject({ tool: 'breathe', before: 8, after: 3, followUpId: 'follow-1' });
    expect(scheduleFollowUp).toHaveBeenCalledWith(
      now + FOLLOW_UP_DELAY,
      { title: 'Mahla', body: 'A quick check-in. Tap to open.' },
      `/follow-up?id=${rating.id}`,
    );
  });

  it('keeps a rating without a before score, and works when the follow-up cannot be scheduled', async () => {
    jest.mocked(scheduleFollowUp).mockResolvedValueOnce(undefined);
    await recordRating('delay', 5);
    expect(useAppStore.getState().ratings[0]).toMatchObject({ tool: 'delay', after: 5 });
    expect(useAppStore.getState().ratings[0].before).toBeUndefined();
    expect(useAppStore.getState().ratings[0].followUpId).toBeUndefined();
  });

  it('records the answer and cancels the notification still waiting', async () => {
    const rating = await recordRating('memory', 2, 6);
    await answerFollowUp(rating.id, false);
    expect(useAppStore.getState().ratings[0].smokedAfter).toBe(false);
    expect(cancel).toHaveBeenCalledWith('follow-1');
  });

  it('ignores an unknown id', async () => {
    await answerFollowUp('nope', true);
    expect(cancel).not.toHaveBeenCalled();
  });
});

describe('one-tap craving', () => {
  it('"I made it" logs a beaten craving and no cigarette', async () => {
    useAppStore.getState().completeOnboarding(form, 'quit');
    const event = await finishCraving(true, 'breathe');
    expect(event).toBeUndefined();
    expect(useAppStore.getState().cravings[0]).toMatchObject({ beaten: true, tool: 'breathe' });
    expect(useAppStore.getState().smokes).toHaveLength(0);
  });

  it('"I smoked" logs the craving and the cigarette, and moves the cut-down timer', async () => {
    useAppStore.getState().completeOnboarding(form, 'cutdown');
    const event = await finishCraving(false, 'breathe');
    expect(event?.id).toBeDefined();
    expect(useAppStore.getState().cravings[0]).toMatchObject({ beaten: false, tool: 'breathe' });
    expect(useAppStore.getState().smokes).toHaveLength(1);
    expect(scheduleTimerDone).toHaveBeenCalled();
  });
});

describe('the evening message', () => {
  const NOON = new Date(2026, 9, 29, 12, 0).getTime();

  it('sets 7 days ahead with neutral words by default', async () => {
    useAppStore.getState().setLanguage('en');
    useAppStore.getState().completeOnboarding(form, 'quit', NOON - 3 * 86_400_000);
    useAppStore.getState().setReminder('evening');
    await syncReminder(NOON);
    expect(scheduleReminderAt).toHaveBeenCalledTimes(7);
    expect(scheduleReminderAt).toHaveBeenCalledWith(new Date(2026, 9, 29, 18, 30).getTime(), { title: 'Mahla', body: 'Your daily reminder. Tap to open.' });
    expect(useAppStore.getState().reminderIds).toHaveLength(7);
  });

  it('shows the day and money only when the member chose it, and cancels the old ones', async () => {
    useAppStore.getState().setLanguage('en');
    useAppStore.getState().completeOnboarding(form, 'quit', NOON - 3 * 86_400_000);
    useAppStore.getState().setReminder('evening');
    await syncReminder(NOON);
    const old = useAppStore.getState().reminderIds!;
    useAppStore.getState().setShowReminderProgress(true);
    await syncReminder(NOON);
    for (const id of old) expect(cancel).toHaveBeenCalledWith(id);
    const bodies = jest.mocked(scheduleReminderAt).mock.calls.slice(7).map(([, content]) => content.body);
    expect(bodies[0]).toMatch(/^Day 4 · \$\d/);
    expect(bodies).toHaveLength(7);
    useAppStore.getState().setShowReminderProgress(false);
  });

  it('sets nothing when muted or without a chosen time', async () => {
    useAppStore.getState().completeOnboarding(form, 'quit', NOON);
    await syncReminder(NOON);
    useAppStore.getState().setReminder('evening');
    useAppStore.getState().setNotificationsMuted(true);
    await syncReminder(NOON);
    expect(scheduleReminderAt).not.toHaveBeenCalled();
    useAppStore.getState().setNotificationsMuted(false);
  });
});
