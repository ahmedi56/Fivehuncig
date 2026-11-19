import AsyncStorage from '@react-native-async-storage/async-storage';

import { useSosSession } from './sos-session';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const save = (delayEndsAt: number) =>
  AsyncStorage.setItem('fivehuncig-sos', JSON.stringify({ state: { delayEndsAt, tool: 'delay' }, version: 0 }));

describe('SOS session', () => {
  beforeEach(() => useSosSession.getState().end());

  it('restores a running delay after the app restarts', async () => {
    const endsAt = Date.now() + 3 * 60_000;
    await save(endsAt);
    await useSosSession.persist.rehydrate();
    expect(useSosSession.getState().delayEndsAt).toBe(endsAt);
  });

  it('drops a delay from an earlier craving', async () => {
    await save(Date.now() - 2 * 60 * 60_000);
    await useSosSession.persist.rehydrate();
    expect(useSosSession.getState().delayEndsAt).toBeUndefined();
  });

  it('starts the delay again from now', () => {
    useSosSession.getState().startDelay();
    const first = useSosSession.getState().delayEndsAt!;
    useSosSession.getState().startDelay(10);
    expect(useSosSession.getState().delayEndsAt!).toBeGreaterThan(first);
  });

  it('keeps the craving level for the current craving only', () => {
    useSosSession.getState().setCravingLevel(7);
    expect(useSosSession.getState().cravingLevel).toBe(7);
    useSosSession.getState().end();
    expect(useSosSession.getState().cravingLevel).toBeUndefined();
  });
});
