import { Redirect, useRouter } from 'expo-router';
import { View } from 'react-native';

import { FEATURES } from '@/config/features';
import { Row, Screen, Text } from '@/components/ui';
import { useT } from '@/i18n';
import { useAppStore } from '@/store/app-store';

/**
 * "I need support": three ways to get help right now, one tap each.
 * Nothing here needs the network except the community itself.
 */
function SupportScreen() {
  const t = useT();
  const router = useRouter();
  const aiConsent = useAppStore((s) => s.aiConsent);
  // Replace this sheet so "back" from the chosen path returns to where the member was.
  const go = (href: Parameters<typeof router.replace>[0]) => router.replace(href);

  return (
    <Screen edges={['bottom']}>
      <Text variant="title" accessibilityRole="header">
        {t.community.support.title}
      </Text>
      <Text tone="soft">{t.community.support.body}</Text>
      <View>
        <Row
          icon="community"
          title={t.community.support.community}
          subtitle={t.community.support.communitySub}
          onPress={() => go({ pathname: '/community/new', params: { type: 'craving' } })}
        />
        <Row icon="wave" title={t.community.support.surf} subtitle={t.community.support.surfSub} onPress={() => go('/urge-surf')} />
        <Row icon="chat" title={t.community.support.ai} subtitle={aiConsent ? t.community.support.aiSub : t.chat.entrySubtitle} onPress={() => go('/chat')} />
        {/* Leads to the SOS tab: same lifebuoy as its tab icon. */}
        <Row icon="sos" title={t.community.support.tools} onPress={() => go('/sos')} />
      </View>
    </Screen>
  );
}

/** Left out of the test release (see src/config/features.ts): back to Today. */
export default function Support() {
  return FEATURES.community ? <SupportScreen /> : <Redirect href="/" />;
}
