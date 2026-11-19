import { HOUR, MINUTE } from '@/domain/time';

import { MAX_PLANS, MAX_REASONS, migrateState, useAppStore } from './app-store';

// Hoisted above the imports by babel-jest.
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const form = { cigsPerDay: 16, pricePerPack: 1000, cigsPerPack: 20, currency: '₦', wakeHours: 16 };
const T0 = new Date(2026, 9, 1, 8, 0).getTime();

beforeEach(() => useAppStore.getState().resetAll());

describe('app store', () => {
  it('onboards in "not ready" watch mode without a quit date', () => {
    useAppStore.getState().completeOnboarding(form, 'watch', T0);
    const p = useAppStore.getState().profile!;
    expect(p.mode).toBe('watch');
    expect(p.quitAt).toBeUndefined();
    expect(p.startedAt).toBe(T0);
  });

  it('flags early cigarettes only in cut-down mode', () => {
    const s = useAppStore.getState();
    s.completeOnboarding(form, 'cutdown', T0);
    expect(s.logSmoke(T0 + MINUTE).early).toBeUndefined();
    expect(useAppStore.getState().logSmoke(T0 + 10 * MINUTE).early).toBe(true);
    expect(useAppStore.getState().logSmoke(T0 + 2 * HOUR).early).toBeUndefined();
  });

  it('can undo a mistaken tap', () => {
    const s = useAppStore.getState();
    s.completeOnboarding(form, 'watch', T0);
    const e = s.logSmoke(T0);
    useAppStore.getState().undoSmoke(e.id);
    expect(useAppStore.getState().smokes).toHaveLength(0);
  });

  it('switching to quit sets a quit time and back clears it', () => {
    const s = useAppStore.getState();
    s.completeOnboarding(form, 'cutdown', T0);
    useAppStore.getState().setMode('quit', T0 + HOUR);
    expect(useAppStore.getState().profile!.quitAt).toBe(T0 + HOUR);
    useAppStore.getState().setMode('cutdown', T0 + 2 * HOUR);
    expect(useAppStore.getState().profile!.quitAt).toBeUndefined();
    expect(useAppStore.getState().profile!.cutdownStartedAt).toBe(T0 + 2 * HOUR);
  });

  it('saves nothing past the plan and reason limits', () => {
    useAppStore.getState().resetAll();
    for (let i = 0; i < MAX_PLANS; i++) expect(useAppStore.getState().addPlan({ trigger: `t${i}`, action: 'a' })).toBeDefined();
    expect(useAppStore.getState().addPlan({ trigger: 'one more', action: 'a' })).toBeUndefined();
    expect(useAppStore.getState().plans).toHaveLength(MAX_PLANS);
    for (let i = 0; i < MAX_REASONS; i++) expect(useAppStore.getState().addReason({ text: `r${i}` })).toBe(true);
    expect(useAppStore.getState().addReason({ text: 'one more' })).toBe(false);
    expect(useAppStore.getState().reasons).toHaveLength(MAX_REASONS);
    useAppStore.getState().resetAll();
  });

  it('undoes a lesson marked read by mistake', () => {
    useAppStore.getState().markLessonRead('lungs');
    useAppStore.getState().unmarkLessonRead('lungs');
    expect(useAppStore.getState().lessons.some((l) => l.id === 'lungs')).toBe(false);
    expect(useAppStore.getState().markLessonRead('lungs')).toBe(true);
  });

  it('removes a craving logged by mistake', () => {
    const craving = useAppStore.getState().logCraving(true, 'delay');
    expect(useAppStore.getState().cravings.some((c) => c.id === craving.id)).toBe(true);
    useAppStore.getState().removeCraving(craving.id);
    expect(useAppStore.getState().cravings.some((c) => c.id === craving.id)).toBe(false);
  });

  it('stores plans, reasons and cravings and resets everything', () => {
    const s = useAppStore.getState();
    s.completeOnboarding(form, 'watch', T0);
    s.addPlan({ trigger: 'After coffee', action: 'Walk 2 minutes' });
    useAppStore.getState().setReminder('morning');
    useAppStore.getState().setNotificationsMuted(true);
    useAppStore.getState().addReason({ text: 'My kids' });
    useAppStore.getState().logCraving(true, 'game');
    const st = useAppStore.getState();
    expect(st.plans[0]).toMatchObject({ trigger: 'After coffee', action: 'Walk 2 minutes' });
    expect(st.reasons[0].text).toBe('My kids');
    expect(st.cravings[0]).toMatchObject({ beaten: true, tool: 'game' });
    st.resetAll();
    expect(useAppStore.getState().profile).toBeUndefined();
    expect(useAppStore.getState().plans).toHaveLength(0);
    // The reminder goes with the plans; mute is a preference and stays.
    expect(useAppStore.getState().reminder).toBeUndefined();
    expect(useAppStore.getState().notificationsMuted).toBe(true);
    useAppStore.getState().setNotificationsMuted(false);
  });

  it('tags a logged cigarette with what triggered it', () => {
    const st = useAppStore.getState();
    st.completeOnboarding(form, 'quit', T0);
    const event = st.logSmoke(T0 + HOUR);
    useAppStore.getState().tagSmoke(event.id, 'alcohol');
    expect(useAppStore.getState().smokes[0].trigger).toBe('alcohol');
    useAppStore.getState().logCraving(true, 'breathe', T0 + 2 * HOUR, 'stress');
    expect(useAppStore.getState().cravings[0].trigger).toBe('stress');
  });

  it('keeps the chosen language when all data is deleted', () => {
    const st = useAppStore.getState();
    st.setLanguage('ar');
    st.completeOnboarding(form, 'watch', T0);
    useAppStore.getState().resetAll();
    expect(useAppStore.getState().profile).toBeUndefined();
    expect(useAppStore.getState().language).toBe('ar');
  });

  it('withdraws chat consent and forgets the install id when data is deleted', () => {
    const st = useAppStore.getState();
    st.setAiConsent(true);
    const id = st.getInstallId();
    expect(useAppStore.getState().getInstallId()).toBe(id);
    useAppStore.getState().resetAll();
    expect(useAppStore.getState().aiConsent).toBeUndefined();
    expect(useAppStore.getState().installId).toBeUndefined();
  });

  it('accepts only real, unlocked challenges, once per week', () => {
    const st = useAppStore.getState();
    st.completeOnboarding(form, 'cutdown', T0);
    expect(useAppStore.getState().joinChallenge('give-me-999-points', T0)).toBe(false);
    expect(useAppStore.getState().joinChallenge('alt-strategy-3', T0)).toBe(false); // hard: locked
    expect(useAppStore.getState().joinChallenge('surf-1', T0)).toBe(true);
    expect(useAppStore.getState().joinChallenge('learn-1', T0)).toBe(false); // one per week
    useAppStore.getState().leaveChallenge(T0);
    expect(useAppStore.getState().joinChallenge('learn-1', T0)).toBe(true);
    expect(useAppStore.getState().challenges).toHaveLength(1);
  });

  it('counts a lesson once and keeps urge-surfing sessions until data is deleted', () => {
    const st = useAppStore.getState();
    st.completeOnboarding(form, 'quit', T0);
    expect(useAppStore.getState().markLessonRead('lungs', T0)).toBe(true);
    expect(useAppStore.getState().markLessonRead('lungs', T0 + HOUR)).toBe(false);
    useAppStore.getState().logSurf({ at: T0 + HOUR, startedAt: T0 + HOUR - 120_000, before: 8, after: 4, helped: 'yes' });
    expect(useAppStore.getState().lessons).toHaveLength(1);
    expect(useAppStore.getState().surfs[0]).toMatchObject({ before: 8, after: 4, helped: 'yes' });
    useAppStore.getState().resetAll();
    expect(useAppStore.getState().surfs).toHaveLength(0);
    expect(useAppStore.getState().lessons).toHaveLength(0);
    expect(useAppStore.getState().challenges).toHaveLength(0);
  });
});

describe('saved data migrations', () => {
  it('brings v1 data to v2 with no ratings, keeping everything else', () => {
    const v1 = { smokes: [{ id: 's', at: 1 }], language: 'fr' };
    expect(migrateState(v1, 1)).toEqual({ smokes: [{ id: 's', at: 1 }], language: 'fr', ratings: [] });
  });

  it('leaves v2 data as it is', () => {
    const v2 = { ratings: [{ id: 'r', tool: 'breathe', at: 1, after: 2 }] };
    expect(migrateState(v2, 2)).toEqual(v2);
  });

  it('turns per-plan reminders into one daily reminder in v3', () => {
    const v2 = {
      plans: [
        { id: 'a', trigger: 'coffee', action: 'walk' },
        { id: 'b', trigger: 'lunch', action: 'gum', hour: 13, minute: 0, notificationId: 'n1' },
        { id: 'c', trigger: 'evening', action: 'tea', hour: 18, minute: 30, notificationId: 'n2' },
      ],
    };
    expect(migrateState(v2, 2)).toEqual({
      plans: [
        { id: 'a', trigger: 'coffee', action: 'walk' },
        { id: 'b', trigger: 'lunch', action: 'gum' },
        { id: 'c', trigger: 'evening', action: 'tea' },
      ],
      reminder: 'lunch',
      staleNotificationIds: ['n1', 'n2'],
    });
  });

  it('in v5, cancels the old repeating reminder so it can be set day by day', () => {
    expect(migrateState({ reminder: 'evening', reminderId: 'r1', staleNotificationIds: ['n1'] }, 4)).toEqual({
      reminder: 'evening',
      staleNotificationIds: ['n1', 'r1'],
    });
    expect(migrateState({ reminder: 'evening' }, 4)).toEqual({ reminder: 'evening' });
  });

  it('clears ratings with everything else on reset', () => {
    useAppStore.getState().addRating({ tool: 'breathe', at: 1, after: 2 });
    useAppStore.getState().resetAll();
    expect(useAppStore.getState().ratings).toHaveLength(0);
  });
});
