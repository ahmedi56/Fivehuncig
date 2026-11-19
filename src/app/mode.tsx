import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ModePicker } from '@/components/mode-picker';
import { Button, Panel, Screen, Text } from '@/components/ui';
import { currentGap } from '@/domain/schedule';
import { formatDuration } from '@/domain/time';
import type { Mode } from '@/domain/types';
import { useNow } from '@/hooks/use-now';
import { formatNumber, useLang, useT } from '@/i18n';
import { changeMode } from '@/services/actions';
import { useAppStore } from '@/store/app-store';

const STEPS = [
  { value: 0.05, key: 'gentle' },
  { value: 0.1, key: 'normal' },
  { value: 0.15, key: 'faster' },
] as const;

export default function ModeScreen() {
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const profile = useAppStore((s) => s.profile);
  const now = useNow(60_000);
  const [mode, setMode] = useState<Mode>(profile?.mode ?? 'cutdown');
  const [step, setStep] = useState(profile?.weeklyStep ?? 0.1);
  if (!profile) return null;

  const save = async () => {
    useAppStore.getState().setWeeklyStep(step);
    await changeMode(mode);
    // Opened from a link there may be nothing to go back to.
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <Screen edges={['bottom']}>
      <Text tone="soft">{t.mode.intro}</Text>
      <ModePicker value={mode} onChange={setMode} />
      {mode === 'cutdown' ? (
        <Panel>
          <Text variant="bodyStrong">{t.mode.howFast}</Text>
          {profile.mode === 'cutdown' ? (
            <Text variant="small" tone="soft">
              {t.mode.currentGap(formatDuration(currentGap(profile, now), t.units, (x) => formatNumber(x, lang)))}
            </Text>
          ) : null}
          {STEPS.map((s) => (
            <Button
              key={s.value}
              kind={step === s.value ? 'primary' : 'secondary'}
              label={t.mode.steps[s.key]}
              onPress={() => setStep(s.value)}
            />
          ))}
        </Panel>
      ) : null}
      <Button big label={t.common.save} onPress={save} />
    </Screen>
  );
}
