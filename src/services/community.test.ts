import { community, toCommunityError } from './community';

// One fake Supabase client for the whole file. The service reads its env vars on every call,
// so each test only sets process.env; no module reloading needed.
const mockAuth = { getSession: jest.fn(), signInAnonymously: jest.fn(), signOut: jest.fn() };
const mockRpc = jest.fn();
jest.mock('@supabase/supabase-js', () => ({ createClient: () => ({ auth: mockAuth, rpc: mockRpc }) }));

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('community error mapping', () => {
  it('maps database errors to known codes and never leaks raw messages', () => {
    expect(toCommunityError({ message: 'rate_limited' })).toBe('rate_limited');
    expect(toCommunityError({ message: 'links_not_allowed', code: '22023' })).toBe('links_not_allowed');
    expect(toCommunityError({ message: 'TypeError: Failed to fetch' })).toBe('network');
    expect(toCommunityError({ message: 'relation "private.posts" does not exist' })).toBe('unknown');
    expect(toCommunityError(undefined)).toBe('unknown');
  });
});

describe('anonymous sign-in with CAPTCHA', () => {
  const load = (env: Record<string, string | undefined>) => {
    Object.assign(process.env, {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      EXPO_PUBLIC_HCAPTCHA_SITE_KEY: '',
      ...env,
    });
    return { community };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.getSession.mockResolvedValue({ data: { session: null } });
    mockAuth.signInAnonymously.mockResolvedValue({ error: null });
    mockRpc.mockResolvedValue({ data: [], error: null });
  });

  it('with a site key, never signs in silently: not signed in counts as "not joined"', async () => {
    const { community } = load({ EXPO_PUBLIC_HCAPTCHA_SITE_KEY: 'site-key' });
    expect(await community.me()).toEqual({ ok: true, data: undefined });
    expect(await community.feed()).toEqual({ ok: false, error: 'captcha_required' });
    expect(mockAuth.signInAnonymously).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('passes the CAPTCHA token to Supabase on sign-in', async () => {
    const { community } = load({ EXPO_PUBLIC_HCAPTCHA_SITE_KEY: 'site-key' });
    expect(await community.signIn('token-123')).toEqual({ ok: true, data: true });
    expect(mockAuth.signInAnonymously).toHaveBeenCalledWith({ options: { captchaToken: 'token-123' } });
  });

  it('reuses a saved session without a new check', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: { access_token: 'x' } } });
    const { community } = load({ EXPO_PUBLIC_HCAPTCHA_SITE_KEY: 'site-key' });
    expect((await community.feed()).ok).toBe(true);
    expect(mockAuth.signInAnonymously).not.toHaveBeenCalled();
  });

  it('without a site key, signs in anonymously as before', async () => {
    const { community } = load({});
    expect((await community.feed()).ok).toBe(true);
    expect(mockAuth.signInAnonymously).toHaveBeenCalledWith(undefined);
  });

  it('a rejected CAPTCHA is reported as captcha_failed', async () => {
    mockAuth.signInAnonymously.mockResolvedValue({ error: { message: 'captcha protection: request disallowed (invalid-input-response)' } });
    const { community } = load({ EXPO_PUBLIC_HCAPTCHA_SITE_KEY: 'site-key' });
    expect(await community.signIn('bad')).toEqual({ ok: false, error: 'captcha_failed' });
  });

  it('deleting data when never signed in creates no account', async () => {
    const { community } = load({ EXPO_PUBLIC_HCAPTCHA_SITE_KEY: '' });
    expect(await community.deleteMyData()).toEqual({ ok: true, data: null });
    expect(mockAuth.signInAnonymously).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
