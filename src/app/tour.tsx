import { useRouter } from 'expo-router';

import { AppTour } from '@/components/app-tour';
import { Button, Screen } from '@/components/ui';
import { useT } from '@/i18n';

/**
 * The onboarding tour again, opened from Settings. Changes nothing; just a reminder of where
 * things are. The header bar shows the title ("App tour").
 */
export default function Tour() {
  const t = useT();
  const router = useRouter();
  // Opened from a link there may be nothing to go back to.
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <Screen edges={['bottom']}>
      <AppTour />
      <Button big label={t.settings.tourDone} onPress={close} />
    </Screen>
  );
}
