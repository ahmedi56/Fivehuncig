type Service = typeof import('./notifications');

/** Loads the service fresh for a given platform / Expo Go state. */
function loadService(os: 'ios' | 'android' | 'web', expoGo: boolean, notifications: () => object): Service {
  let service!: Service;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({ Platform: { OS: os } }));
    jest.doMock('expo', () => ({ isRunningInExpoGo: () => expoGo }));
    jest.doMock('expo-notifications', notifications);
    service = jest.requireActual<Service>('./notifications');
  });
  return service;
}

const TEXT = { title: 'If: coffee', body: 'Then: walk' };

/** Simulates SDK 53+ behaviour: evaluating the package in Android Expo Go throws. */
function throwingOnImport(): object {
  throw new Error('Android Push notifications were removed from Expo Go');
}

describe('notifications service', () => {
  it('never loads expo-notifications in Android Expo Go and fails soft', async () => {
    const factory = jest.fn(throwingOnImport);
    const service = loadService('android', true, factory);

    expect(service.notificationsSupported).toBe(false);
    await expect(service.configureNotifications('Reminders')).resolves.toBeUndefined();
    await expect(service.ensurePermission()).resolves.toBe(false);
    await expect(service.scheduleTimerDone(Date.now() + 60_000, TEXT)).resolves.toBeUndefined();
    await expect(service.scheduleReminderAt(Date.now() + 60_000, TEXT)).resolves.toBeUndefined();
    await expect(service.cancel('id')).resolves.toBeUndefined();
    await expect(service.cancelAll()).resolves.toBeUndefined();
    await expect(service.scheduleFollowUp(Date.now() + 60_000, TEXT, '/follow-up?id=x')).resolves.toBeUndefined();
    const stop = service.onNotificationOpen(() => undefined);
    expect(typeof stop).toBe('function');
    stop();
    expect(factory).not.toHaveBeenCalled();
  });

  it('never loads expo-notifications on web', async () => {
    const factory = jest.fn(throwingOnImport);
    const service = loadService('web', false, factory);

    expect(service.notificationsSupported).toBe(false);
    await expect(service.cancelAll()).resolves.toBeUndefined();
    expect(factory).not.toHaveBeenCalled();
  });

  it('stays enabled in Android development builds and on iOS', () => {
    expect(loadService('android', false, throwingOnImport).notificationsSupported).toBe(true);
    expect(loadService('ios', true, throwingOnImport).notificationsSupported).toBe(true);
  });

  it('puts a "Breathe now" button on reminders that opens the one-tap breathing', () => {
    const service = loadService('ios', false, () => ({}));
    expect(service.breatheActions('Breathe now')).toEqual([
      { identifier: 'breathe', buttonTitle: 'Breathe now', options: { opensAppToForeground: true } },
    ]);
    expect(service.withBreatheButton(TEXT)).toEqual({ ...TEXT, categoryIdentifier: 'craving' });

    const DEFAULT = 'expo.default';
    const response = (actionIdentifier: string, url?: string) => ({ actionIdentifier, notification: { request: { content: { data: url ? { url } : null } } } });
    expect(service.urlForResponse(response('breathe'), DEFAULT)).toBe('/breathe?quick=1');
    expect(service.urlForResponse(response(DEFAULT, '/follow-up?id=a1'), DEFAULT)).toBe('/follow-up?id=a1');
    expect(service.urlForResponse(response(DEFAULT), DEFAULT)).toBeUndefined();
    expect(service.urlForResponse(response('something-else', '/x'), DEFAULT)).toBeUndefined();
    expect(service.urlForResponse(null, DEFAULT)).toBeUndefined();
  });
});
