import type { SafetyKind } from '@/domain/safety';
import { useT } from '@/i18n';

import { SupportList } from './support-list';
import { Panel, Text } from './ui';

/** Fixed, reviewed wording plus verified lines. Shown instead of an AI reply for crisis messages. */
export function SafetyCard({ kind }: { kind: SafetyKind }) {
  const t = useT();
  const selfHarm = kind === 'self-harm';
  return (
    <Panel tone="ember">
      <Text variant="heading" accessibilityRole="header" accessibilityLiveRegion="assertive">
        {selfHarm ? t.safety.selfHarmTitle : t.safety.medicalTitle}
      </Text>
      <Text>{selfHarm ? t.safety.selfHarmBody : t.safety.medicalBody}</Text>
      <Text variant="bodyStrong">{t.safety.localEmergency}</Text>
      <SupportList kinds={selfHarm ? ['crisis', 'urgent'] : ['urgent']} showWorldwide={false} />
    </Panel>
  );
}
