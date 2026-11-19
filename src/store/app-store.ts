import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { isEarly } from '@/domain/schedule';
import { challengeById, unlockedLevels, weekKey } from '@/domain/journey';
import { nearestReminder, pruneScheduled, type ReminderKey } from '@/domain/notify';
import type { CravingRating } from '@/domain/ratings';
import type {
  ChallengeEntry,
  CravingEvent,
  CravingTool,
  LessonRead,
  Mode,
  Plan,
  Profile,
  Reason,
  SmokeEvent,
  TriggerId,
  SupportGiven,
  UrgeSurfSession,
} from '@/domain/types';
import type { Lang } from '@/i18n/plural';
import type { ParsedProfileForm } from '@/domain/validate';

/** Hard caps keep storage small and fast even after years of use. */
const MAX_SMOKES = 20_000;
const MAX_CRAVINGS = 5_000;
export const MAX_PLANS = 20;
export const MAX_REASONS = 30;
const MAX_SURFS = 2_000;
const MAX_RATINGS = 2_000;
const MAX_CHALLENGES = 520; // ten years of weeks

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function capped<T>(list: T[], max: number): T[] {
  return list.length > max ? list.slice(list.length - max) : list;
}

export interface AppState {
  profile?: Profile;
  smokes: SmokeEvent[];
  cravings: CravingEvent[];
  plans: Plan[];
  reasons: Reason[];
  surfs: UrgeSurfSession[];
  /** "Craving now? 0–10" before and after SOS tools, and the 30-minute follow-up answer. */
  ratings: CravingRating[];
  lessons: LessonRead[];
  challenges: ChallengeEntry[];
  supports: SupportGiven[];
  /** Id of the scheduled "next cigarette allowed" notification, if any. */
  timerNotificationId?: string;
  nudgeDismissedAt?: number;
  /** Chosen app language; undefined means "follow the phone". Kept when data is deleted. */
  language?: Lang;
  /** The member agreed that chat messages go to the AI provider. Off until they opt in. */
  aiConsent?: boolean;
  /** Random id sent with chat requests for rate limiting only. Not linked to any person. */
  installId?: string;
  /** Country for the Get help page (ISO alpha-2); undefined means "use the phone's region". */
  country?: string;
  /** The member switched off vibration (taps, timers). A display preference, kept on reset. */
  hapticsOff?: boolean;
  /** Game sounds (Pattern Pop notes, Block Drop) are on unless switched off. */
  soundsOff?: boolean;
  /** The calm wave sound in Breathe and Urge surfing is off unless switched on. */
  wavesOn?: boolean;
  /** The one daily reminder ("the evening message"); undefined means none. */
  reminder?: ReminderKey;
  /** The reminders set for the next days (domain/reminder.ts). Replaced the single `reminderId` in v5. */
  reminderIds?: string[];
  /** Opt-in: the reminder shows the day count and money kept. Off: it says only "Your daily reminder". */
  showReminderProgress?: boolean;
  /** One tap in Settings stops every notification. A preference, kept on reset. */
  notificationsMuted?: boolean;
  /** Fire times of scheduled one-off notifications, so a day never gets more than 2 in total. */
  scheduledNotifications?: number[];
  /** Per-plan reminders from before v3, still to be cancelled on the phone. */
  staleNotificationIds?: string[];
  /** When the member confirmed they are 18+ and agreed to their data being saved on the phone (onboarding). */
  consentedAt?: number;

  completeOnboarding: (form: ParsedProfileForm, mode: Mode, now?: number) => void;
  updateProfile: (form: ParsedProfileForm) => void;
  setMode: (mode: Mode, now?: number) => void;
  setWeeklyStep: (step: number) => void;
  logSmoke: (now?: number, trigger?: TriggerId) => SmokeEvent;
  undoSmoke: (id: string) => void;
  /** Adds or changes the trigger on a logged cigarette (slip rescue asks after logging). */
  tagSmoke: (id: string, trigger: TriggerId) => void;
  logCraving: (beaten: boolean, tool?: CravingTool, now?: number, trigger?: TriggerId) => CravingEvent;
  /** Removes a craving logged by mistake (the SOS result screen offers Undo). */
  removeCraving: (id: string) => void;
  /** Undefined when the plan list is full: nothing is saved. */
  addPlan: (plan: Omit<Plan, 'id'>) => Plan | undefined;
  removePlan: (id: string) => void;
  /** False when the list is full: nothing is saved. */
  addReason: (reason: Omit<Reason, 'id'>) => boolean;
  removeReason: (id: string) => void;
  setTimerNotificationId: (id?: string) => void;
  dismissNudge: (now?: number) => void;
  setLanguage: (language: Lang) => void;
  logSurf: (session: Omit<UrgeSurfSession, 'id'>) => UrgeSurfSession;
  /** Saves a before/after rating for an SOS tool. Use services/actions `recordRating`, which also schedules the follow-up. */
  addRating: (rating: Omit<CravingRating, 'id'>) => CravingRating;
  setRatingFollowUp: (id: string, followUpId?: string) => void;
  answerFollowUp: (id: string, smokedAfter: boolean) => void;
  /** Records a Learn article as read; returns false if it was already read. */
  markLessonRead: (id: string, now?: number) => boolean;
  /** Undoes a mistaken "I've read this" (points and memories are recomputed from the list). */
  unmarkLessonRead: (id: string) => void;
  /** Joins a weekly challenge for the current week; returns false if not allowed. */
  joinChallenge: (challengeId: string, now?: number) => boolean;
  leaveChallenge: (now?: number) => void;
  /** Records that the member replied to support someone else (after the server accepted it). */
  logSupport: (now?: number) => void;
  setAiConsent: (consent: boolean) => void;
  getInstallId: () => string;
  setCountry: (country?: string) => void;
  setHapticsOff: (off: boolean) => void;
  setSoundsOff: (off: boolean) => void;
  setWavesOn: (on: boolean) => void;
  setReminder: (reminder?: ReminderKey) => void;
  setReminderIds: (ids?: string[]) => void;
  setShowReminderProgress: (show: boolean) => void;
  setNotificationsMuted: (muted: boolean) => void;
  /** Records a one-off notification set to fire at `at`. */
  noteScheduled: (at: number, now?: number) => void;
  clearStaleNotifications: () => void;
  setConsentedAt: (at: number) => void;
  resetAll: () => void;
}

const initialData = {
  profile: undefined,
  smokes: [] as SmokeEvent[],
  cravings: [] as CravingEvent[],
  plans: [] as Plan[],
  reasons: [] as Reason[],
  surfs: [] as UrgeSurfSession[],
  ratings: [] as CravingRating[],
  lessons: [] as LessonRead[],
  challenges: [] as ChallengeEntry[],
  supports: [] as SupportGiven[],
  timerNotificationId: undefined,
  nudgeDismissedAt: undefined,
};

function devStoreKey(): string {
  if (__DEV__) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- dev-only, stripped from production
    const { devDataMode } = require('@/dev/data-mode') as typeof import('@/dev/data-mode');
    const mode = devDataMode();
    if (mode !== 'demo') return `fivehuncig-dev-${mode}`;
  }
  return 'fivehuncig-v1';
}

function devTodayFixture(): Partial<AppState> | undefined {
  if (!__DEV__) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- dev-only, stripped from production
  const { devDataMode } = require('@/dev/data-mode') as typeof import('@/dev/data-mode');
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- dev-only, stripped from production
  const { todayFixture } = require('@/dev/today-fixtures') as typeof import('@/dev/today-fixtures');
  return todayFixture(devDataMode());
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialData,

      completeOnboarding: (form, mode, now = Date.now()) =>
        set({
          profile: {
            ...form,
            mode,
            startedAt: now,
            cutdownStartedAt: mode === 'cutdown' ? now : undefined,
            quitAt: mode === 'quit' ? now : undefined,
            weeklyStep: 0.1,
          },
        }),

      updateProfile: (form) => {
        const profile = get().profile;
        if (profile) set({ profile: { ...profile, ...form } });
      },

      setMode: (mode, now = Date.now()) => {
        const profile = get().profile;
        if (!profile || profile.mode === mode) return;
        set({
          profile: {
            ...profile,
            mode,
            cutdownStartedAt: mode === 'cutdown' ? now : profile.cutdownStartedAt,
            quitAt: mode === 'quit' ? now : undefined,
          },
        });
      },

      setWeeklyStep: (step) => {
        const profile = get().profile;
        if (profile) set({ profile: { ...profile, weeklyStep: Math.min(0.5, Math.max(0, step)) } });
      },

      logSmoke: (now = Date.now(), trigger) => {
        const { profile, smokes } = get();
        const early = profile?.mode === 'cutdown' ? isEarly(profile, smokes, now) : undefined;
        const event: SmokeEvent = { id: newId(), at: now, ...(early ? { early } : {}), ...(trigger ? { trigger } : {}) };
        set({ smokes: capped([...smokes, event], MAX_SMOKES) });
        return event;
      },

      undoSmoke: (id) => set({ smokes: get().smokes.filter((s) => s.id !== id) }),

      tagSmoke: (id, trigger) => set({ smokes: get().smokes.map((s) => (s.id === id ? { ...s, trigger } : s)) }),

      logCraving: (beaten, tool, now = Date.now(), trigger) => {
        const created: CravingEvent = { id: newId(), at: now, beaten, tool, ...(trigger ? { trigger } : {}) };
        set({ cravings: capped([...get().cravings, created], MAX_CRAVINGS) });
        return created;
      },
      removeCraving: (id) => set({ cravings: get().cravings.filter((c) => c.id !== id) }),

      addPlan: (plan) => {
        if (get().plans.length >= MAX_PLANS) return undefined;
        const created = { ...plan, id: newId() };
        set({ plans: [...get().plans, created] });
        return created;
      },


      removePlan: (id) => set({ plans: get().plans.filter((p) => p.id !== id) }),

      addReason: (reason) => {
        if (get().reasons.length >= MAX_REASONS) return false;
        set({ reasons: [...get().reasons, { ...reason, id: newId() }] });
        return true;
      },

      removeReason: (id) => set({ reasons: get().reasons.filter((r) => r.id !== id) }),

      setTimerNotificationId: (timerNotificationId) => set({ timerNotificationId }),

      dismissNudge: (now = Date.now()) => set({ nudgeDismissedAt: now }),

      setLanguage: (language) => set({ language }),

      setAiConsent: (aiConsent) => set({ aiConsent }),

      logSurf: (session) => {
        const created = { ...session, id: newId() };
        set({ surfs: capped([...get().surfs, created], MAX_SURFS) });
        return created;
      },

      addRating: (rating) => {
        const created = { ...rating, id: newId() };
        set({ ratings: capped([...get().ratings, created], MAX_RATINGS) });
        return created;
      },
      setRatingFollowUp: (id, followUpId) => set({ ratings: get().ratings.map((r) => (r.id === id ? { ...r, followUpId } : r)) }),
      answerFollowUp: (id, smokedAfter) => set({ ratings: get().ratings.map((r) => (r.id === id ? { ...r, smokedAfter } : r)) }),

      markLessonRead: (id, now = Date.now()) => {
        if (get().lessons.some((l) => l.id === id)) return false;
        set({ lessons: [...get().lessons, { id, at: now }] });
        return true;
      },
      unmarkLessonRead: (id) => set({ lessons: get().lessons.filter((l) => l.id !== id) }),

      joinChallenge: (challengeId, now = Date.now()) => {
        const { challenges, profile, smokes, cravings, surfs, lessons, plans } = get();
        const def = challengeById(challengeId);
        const week = weekKey(now);
        if (!def || !profile || challenges.some((c) => c.week === week)) return false;
        const data = { startedAt: profile.startedAt, smokes, cravings, surfs, lessons, plans, challenges, supports: get().supports };
        if (!unlockedLevels(data).includes(def.level)) return false;
        set({ challenges: capped([...challenges, { week, challengeId, joinedAt: now }], MAX_CHALLENGES) });
        return true;
      },

      logSupport: (now = Date.now()) => set({ supports: capped([...get().supports, { id: newId(), at: now }], MAX_SURFS) }),

      leaveChallenge: (now = Date.now()) => set({ challenges: get().challenges.filter((c) => c.week !== weekKey(now)) }),

      getInstallId: () => {
        const existing = get().installId;
        if (existing) return existing;
        const installId = `${newId()}-${Math.random().toString(36).slice(2, 10)}`;
        set({ installId });
        return installId;
      },

      setCountry: (country) => set({ country }),
      setHapticsOff: (hapticsOff) => set({ hapticsOff }),
      setSoundsOff: (soundsOff) => set({ soundsOff }),
      setWavesOn: (wavesOn) => set({ wavesOn }),
      setReminder: (reminder) => set({ reminder }),
      setReminderIds: (reminderIds) => set({ reminderIds }),
      setShowReminderProgress: (showReminderProgress) => set({ showReminderProgress }),
      setNotificationsMuted: (notificationsMuted) => set({ notificationsMuted }),
      noteScheduled: (at, now = Date.now()) => set({ scheduledNotifications: [...pruneScheduled(get().scheduledNotifications ?? [], now), at] }),
      clearStaleNotifications: () => set({ staleNotificationIds: undefined }),
      setConsentedAt: (consentedAt) => set({ consentedAt }),

      // Language, country, vibration, sound and mute are preferences and survive; chat consent is withdrawn.
      // The reminder goes with the plans it shows (Settings cancels every scheduled notification).
      resetAll: () =>
        set({ ...initialData, aiConsent: undefined, installId: undefined, reminder: undefined, reminderIds: undefined, scheduledNotifications: undefined, consentedAt: undefined }),
    }),
    {
      // DEV ONLY: in a break-ui data mode the store saves under its own key, so fixtures never
      // touch the real saved data. Production builds always use 'fivehuncig-v1'.
      name: devStoreKey(),
      version: 5,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        profile: s.profile,
        smokes: s.smokes,
        cravings: s.cravings,
        plans: s.plans,
        reasons: s.reasons,
        surfs: s.surfs,
        ratings: s.ratings,
        lessons: s.lessons,
        challenges: s.challenges,
        supports: s.supports,
        timerNotificationId: s.timerNotificationId,
        nudgeDismissedAt: s.nudgeDismissedAt,
        language: s.language,
        aiConsent: s.aiConsent,
        installId: s.installId,
        country: s.country,
        hapticsOff: s.hapticsOff,
        soundsOff: s.soundsOff,
        wavesOn: s.wavesOn,
        reminder: s.reminder,
        reminderIds: s.reminderIds,
        showReminderProgress: s.showReminderProgress,
        notificationsMuted: s.notificationsMuted,
        scheduledNotifications: s.scheduledNotifications,
        staleNotificationIds: s.staleNotificationIds,
        consentedAt: s.consentedAt,
      }),
      // v2 (Oct 2026) adds craving ratings. v3 replaces per-plan reminders with one daily reminder.
      // v4 adds the onboarding consent date; members from before simply have none.
      // v5 sets the daily reminder day by day: the single reminder id becomes a list.
      migrate: (persisted, version) => migrateState(persisted, version),
      // DEV ONLY: a break-ui data mode replaces the saved data with its fixture on every load.
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<AppState>), ...devTodayFixture() }),
    },
  ),
);

/** Brings saved data from an older schema version up to date. Exported for tests. */
export function migrateState(persisted: unknown, version: number): AppState {
  let state = (persisted ?? {}) as Partial<AppState>;
  if (version < 2) state = { ...state, ratings: state.ratings ?? [] };
  // v3: at most 2 notifications a day. The first plan with a reminder time sets the one daily
  // reminder; the old per-plan notifications are cancelled on the next start.
  if (version < 3 && state.plans?.some((p) => p.hour !== undefined || p.notificationId)) {
    const timed = state.plans.find((p) => p.hour !== undefined);
    const stale = state.plans.flatMap((p) => (p.notificationId ? [p.notificationId] : []));
    state = {
      ...state,
      plans: state.plans.map(({ hour: _h, minute: _m, notificationId: _n, ...plan }) => plan),
      ...(timed ? { reminder: nearestReminder(timed.hour!, timed.minute) } : {}),
      ...(stale.length ? { staleNotificationIds: stale } : {}),
    };
  }
  // v5: the repeating reminder is cancelled on the next start and set again day by day.
  const legacy = state as Partial<AppState> & { reminderId?: string };
  if (version < 5 && legacy.reminderId) {
    const { reminderId, ...rest } = legacy;
    state = { ...rest, staleNotificationIds: [...(rest.staleNotificationIds ?? []), reminderId] };
  }
  return state as AppState;
}

/** True once saved data has been loaded from the device. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useAppStore.persist.onFinishHydration(onChange),
    () => useAppStore.persist.hasHydrated(),
    () => false,
  );
}
