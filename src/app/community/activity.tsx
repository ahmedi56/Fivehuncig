import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { FEATURES } from '@/config/features';
import { ErrorPanel, timeAgo } from '@/components/community';
import { Row, Screen, Text } from '@/components/ui';
import { useLang, useT } from '@/i18n';
import { community, type CommunityError, type CommunityNotification } from '@/services/community';

/** In-app activity. Never says who reacted or replied, only that someone did. */
function ActivityScreen() {
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const [items, setItems] = useState<CommunityNotification[]>();
  const [error, setError] = useState<CommunityError>();

  useFocusEffect(
    useCallback(() => {
      community.notifications().then((r) => {
        if (!r.ok) return setError(r.error);
        setItems(r.data);
        if (r.data.some((n) => !n.read)) community.markRead();
      });
    }, []),
  );

  if (error) return <Screen edges={['bottom']}><ErrorPanel error={error} /></Screen>;

  return (
    <Screen edges={['bottom']}>
      {items && items.length === 0 ? <Text tone="soft">{t.community.activity.empty}</Text> : null}
      <View>
        {(items ?? []).map((n) => (
          <Row
            key={n.id}
            title={`${n.read ? '' : '● '}${t.community.activity[n.kind]}`}
            subtitle={timeAgo(n.created_at, t, lang)}
            onPress={n.post_id ? () => router.push({ pathname: '/community/[id]', params: { id: String(n.post_id) } }) : undefined}
          />
        ))}
      </View>
    </Screen>
  );
}

/** Left out of the test release (see src/config/features.ts): back to Today. */
export default function Activity() {
  return FEATURES.community ? <ActivityScreen /> : <Redirect href="/" />;
}
