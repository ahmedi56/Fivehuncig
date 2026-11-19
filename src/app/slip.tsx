import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { MedsNudge } from '@/components/meds-nudge';
import { Button, Chip, Panel, Screen, Text } from '@/components/ui';
import { smokeFreeDays } from '@/domain/stats';
import { TRIGGERS, type TriggerId } from '@/domain/types';
import { useNow } from '@/hooks/use-now';
import { useT } from '@/i18n';
import { useAppStore } from '@/store/app-store';
import { space } from '@/theme';

/** Slip rescue: a slip is not a relapse. Nothing is reset, and the next step takes 2 minutes. */
export default function Slip() {
  const router = useRouter();
  const t = useT();
  const { smoke } = useLocalSearchParams<{ smoke?: string }>();
  const profile = useAppStore((s) => s.profile);
  const smokes = useAppStore((s) => s.smokes);
  // Only tag a cigarette that really exists; the id comes from navigation params.
  const event = smokes.find((s) => s.id === smoke);
  const cause = event?.trigger;
  const now = useNow(60_000);
  const days = profile ? smokeFreeDays(smokes, profile, now) : 0;

  // Opened from a link or notification there may be nothing to go back to.
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const pick = (trigger: TriggerId) => {
    if (event) useAppStore.getState().tagSmoke(event.id, trigger);
  };

  return (
    <Screen edges={['bottom']}>
      <Text variant="title" accessibilityRole="header">
        {t.slip.title}
      </Text>
      <Text>{t.slip.body(days)}</Text>

      {event ? (
        <Panel>
          <Text variant="bodyStrong">{t.slip.whatHappened}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }} accessibilityRole="radiogroup">
            {TRIGGERS.map((id) => (
              <Chip role="radio" key={id} label={t.triggers[id]} selected={cause === id} onPress={() => pick(id)} />
            ))}
          </View>
          {cause ? (
            <Text variant="small" tone="soft" accessibilityLiveRegion="polite">
              {t.slip.planHint(t.triggers[cause])}
            </Text>
          ) : null}
        </Panel>
      ) : null}

      {cause ? (
        <Button
          label={t.slip.makePlan}
          onPress={() => {
            leave();
            router.push({ pathname: '/plans', params: { trigger: cause } });
          }}
        />
      ) : null}
      <Button kind={cause ? 'secondary' : 'primary'} label={t.slip.keepGoing} onPress={leave} />
      <MedsNudge />
    </Screen>
  );
}
