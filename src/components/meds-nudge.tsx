import { useRouter } from 'expo-router';

import { useT } from '@/i18n';

import { Button, Panel, Text } from './ui';

/**
 * After a cigarette: the strongest evidence is app plus medicine, so point to the medicine panel on
 * Help. One quiet card and one tap; no drug names, no doses (docs/RESEARCH_QUIT_EVIDENCE.md).
 */
export function MedsNudge() {
  const t = useT();
  const router = useRouter();
  return (
    <Panel tone="sky">
      <Text variant="bodyStrong">{t.help.nudgeTitle}</Text>
      <Text>{t.help.nudgeBody}</Text>
      <Button kind="quiet" label={t.help.nudgeLink} onPress={() => router.push('/help')} />
    </Panel>
  );
}
