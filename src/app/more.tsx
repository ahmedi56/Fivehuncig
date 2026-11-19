import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { FEATURES } from '@/config/features';
import { MODES } from '@/components/mode-picker';
import { Row, Screen, Text } from '@/components/ui';
import { useT } from '@/i18n';
import { useAppStore } from '@/store/app-store';

export default function More() {
  const router = useRouter();
  const t = useT();
  const mode = useAppStore((s) => s.profile?.mode);
  const plans = useAppStore((s) => s.plans.length);
  const reasons = useAppStore((s) => s.reasons.length);
  const current = MODES.find((m) => m.mode === mode);

  return (
    <Screen edges={['bottom']}>
      <View>
        <Row
          icon={current?.icon}
          title={t.more.approach}
          subtitle={mode ? t.modes[mode].title : undefined}
          onPress={() => router.push('/mode')}
        />
        <Row
          icon="target"
          title={t.more.plans}
          subtitle={plans ? t.more.plansCount(plans) : t.more.plansEmpty}
          onPress={() => router.push('/plans')}
        />
        <Row
          icon="image"
          title={t.more.reasons}
          // Its own count string: in French "raison" is feminine ("1 enregistrée"), "plan" is not.
          subtitle={reasons ? t.sos.reasonsCount(reasons) : t.more.reasonsEmpty}
          onPress={() => router.push('/reasons')}
        />
        <Row icon="phone" title={t.more.help} subtitle={t.more.helpSubtitle} onPress={() => router.push('/help')} />
        {FEATURES.community ? (
          <Row icon="community" title={t.more.community} subtitle={t.more.communitySubtitle} onPress={() => router.push('/community/profile')} />
        ) : null}
        <Row icon="settings" title={t.more.settings} subtitle={t.more.settingsSubtitle} onPress={() => router.push('/settings')} />
      </View>
      <Text variant="small" tone="soft">
        {t.app.disclaimer}
      </Text>
    </Screen>
  );
}
