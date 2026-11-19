import ConfirmHcaptcha from '@hcaptcha/react-native-hcaptcha';
import { useRef, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { useLang } from '@/i18n';
import { captchaSiteKey } from '@/services/supabase';

export type CaptchaResult = { ok: true; token?: string } | { ok: false; reason: 'cancelled' | 'failed' };

/**
 * hCaptcha before the first anonymous sign-in (Supabase Attack Protection). Invisible by default:
 * most people get a token without seeing anything; a challenge only appears when hCaptcha is unsure.
 * Without EXPO_PUBLIC_HCAPTCHA_SITE_KEY it resolves with no token and renders nothing.
 * iOS/Android: hCaptcha's WebView modal. Web: captcha.web.tsx.
 */
export function useCaptcha(): { captcha: ReactNode; getToken: () => Promise<CaptchaResult> } {
  const siteKey = captchaSiteKey();
  const lang = useLang();
  const scheme = useColorScheme();
  const ref = useRef<ConfirmHcaptcha>(null);
  const pending = useRef<(r: CaptchaResult) => void>(undefined);

  const settle = (r: CaptchaResult) => {
    pending.current?.(r);
    pending.current = undefined;
  };

  const getToken = () => {
    if (!siteKey) return Promise.resolve<CaptchaResult>({ ok: true });
    settle({ ok: false, reason: 'cancelled' });
    return new Promise<CaptchaResult>((resolve) => {
      pending.current = resolve;
      ref.current?.show();
    });
  };

  const captcha = siteKey ? (
    <ConfirmHcaptcha
      ref={ref}
      siteKey={siteKey}
      size="invisible"
      baseUrl="https://hcaptcha.com"
      languageCode={lang}
      theme={scheme === 'dark' ? 'dark' : 'light'}
      showLoading
      closableLoading
      onMessage={(event) => {
        const data = event?.nativeEvent?.data;
        if (!data || data === 'open') return;
        if (event.success) {
          // The token goes straight to Supabase; stop the package's expiry timer.
          event.markUsed?.();
          ref.current?.hide('verified');
          return settle({ ok: true, token: data });
        }
        // hide(source) closes without emitting another 'cancel' event.
        ref.current?.hide('closed');
        settle({ ok: false, reason: data === 'cancel' || data === 'challenge-closed' ? 'cancelled' : 'failed' });
      }}
    />
  ) : null;

  return { captcha, getToken };
}
