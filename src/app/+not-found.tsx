import { useRouter } from 'expo-router';

import { Button, Screen, Text } from '@/components/ui';
import { useT } from '@/i18n';

/** Unknown links (old bookmarks, mistyped deep links) land here instead of a blank screen. */
export default function NotFound() {
  const router = useRouter();
  const t = useT();
  return (
    <Screen edges={['bottom']}>
      <Text variant="heading">{t.notFound.title}</Text>
      <Button label={t.notFound.home} onPress={() => router.replace('/')} />
    </Screen>
  );
}
