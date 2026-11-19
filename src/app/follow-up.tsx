import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { FollowUpCard } from '@/components/craving-check';
import { Button, Screen, Text } from '@/components/ui';
import { useT } from '@/i18n';
import { useAppStore } from '@/store/app-store';

/**
 * Opened from the 30-minute follow-up notification. The id comes from the notification, so it is
 * untrusted: unknown or already answered ids get a short message instead of the question.
 */
export default function FollowUp() {
  const t = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  // Read once: answering updates the store, and the card then shows its own thank-you.
  const [initial] = useState(() => useAppStore.getState().ratings.find((r) => r.id === id));

  return (
    <Screen edges={['bottom']}>
      {initial && initial.smokedAfter === undefined ? (
        <FollowUpCard rating={initial} />
      ) : (
        <Text tone="soft">{t.ratings.followUpGone}</Text>
      )}
      <Button kind="secondary" label={t.common.done} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
    </Screen>
  );
}
