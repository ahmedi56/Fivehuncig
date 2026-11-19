import { View } from 'react-native';

import { FEATURES } from '@/config/features';
import { useT } from '@/i18n';

import { Panel, Row, Text } from './ui';

/** The five tabs, then More, drawn with the same icons as the tab bar and the More button on Today. */
const TABS = (['today', 'sos', 'community', 'progress', 'learn'] as const).filter(
  (key) => (key !== 'community' || FEATURES.community) && (key !== 'learn' || FEATURES.learn),
);

/** "Here's where everything is": shown at the end of onboarding and again from Settings. */
export function AppTour() {
  const t = useT();
  return (
    <Panel>
      <Text variant="bodyStrong">{t.onboarding.tourIntro}</Text>
      <View>
        {TABS.map((key) => (
          <Row key={key} icon={key} title={t.onboarding.tour[key][0]} subtitle={t.onboarding.tour[key][1]} />
        ))}
        <Row icon="more" title={t.onboarding.tour.more[0]} subtitle={t.onboarding.tour.more[1]} />
      </View>
    </Panel>
  );
}
