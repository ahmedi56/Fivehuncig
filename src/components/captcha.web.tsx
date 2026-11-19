import HCaptchaWidget from '@hcaptcha/react-hcaptcha';
import { useRef, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { useLang } from '@/i18n';
import { captchaSiteKey } from '@/services/supabase';

export type CaptchaResult = { ok: true; token?: string } | { ok: false; reason: 'cancelled' | 'failed' };

/** Web version of captcha.tsx: hCaptcha's own invisible widget, run on demand. */
export function useCaptcha(): { captcha: ReactNode; getToken: () => Promise<CaptchaResult> } {
  const siteKey = captchaSiteKey();
  const lang = useLang();
  const scheme = useColorScheme();
  const ref = useRef<HCaptchaWidget>(null);

  const getToken = async (): Promise<CaptchaResult> => {
    if (!siteKey) return { ok: true };
    if (!ref.current) return { ok: false, reason: 'failed' };
    try {
      const { response } = await ref.current.execute({ async: true });
      return { ok: true, token: response };
    } catch (e) {
      // execute() rejects with 'challenge-closed' when the member closes the puzzle.
      return { ok: false, reason: String(e).includes('closed') ? 'cancelled' : 'failed' };
    } finally {
      // A token is single-use: get a fresh one next time.
      ref.current?.resetCaptcha();
    }
  };

  const captcha = siteKey ? (
    <HCaptchaWidget ref={ref} sitekey={siteKey} size="invisible" languageOverride={lang} theme={scheme === 'dark' ? 'dark' : 'light'} />
  ) : null;

  return { captcha, getToken };
}
