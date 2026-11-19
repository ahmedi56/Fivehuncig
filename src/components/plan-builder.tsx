import { useState } from 'react';
import { View } from 'react-native';

import { cleanText } from '@/domain/validate';
import { useT } from '@/i18n';
import { space } from '@/theme';

import { CharsLeft } from './chars-left';
import { Button, Chip, Field, Text } from './ui';

export interface PlanDraft {
  trigger: string;
  action: string;
}

export function PlanBuilder({
  onSubmit,
  submitLabel,
  initialTrigger = '',
  initial,
}: {
  /** Return a message to keep the form as it is and show why the plan wasn't saved. */
  onSubmit: (plan: PlanDraft) => string | void | Promise<string | void>;
  submitLabel: string;
  initialTrigger?: string;
  /** A plan to edit, e.g. when going back a step: the form opens filled in instead of empty. */
  initial?: PlanDraft;
}) {
  const t = useT();
  const [trigger, setTrigger] = useState(initial?.trigger ?? initialTrigger);
  const [action, setAction] = useState(initial?.action ?? '');
  const [error, setError] = useState<string>();

  const submit = async () => {
    const tr = cleanText(trigger, 80);
    const a = cleanText(action, 80);
    if (!tr || !a) return setError(t.validation.planBothParts);
    const refused = await onSubmit({ trigger: tr, action: a });
    if (refused) return setError(refused);
    setError(undefined);
    setTrigger('');
    setAction('');
  };

  return (
    <View style={{ gap: space.md }}>
      <Text variant="heading">{t.plan.ifHeading}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }} accessibilityRole="radiogroup">
        {t.plan.triggers.map((x) => (
          <Chip role="radio" key={x} label={x} selected={trigger === x} onPress={() => setTrigger(x)} />
        ))}
      </View>
      <Field
        label={t.common.orTypeYourOwn}
        value={trigger}
        onChangeText={setTrigger}
        maxLength={80}
        placeholder={t.plan.triggerExample}
      />
      <CharsLeft value={trigger} max={80} showAt={20} warnAt={10} />

      <Text variant="heading">{t.plan.thenHeading}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }} accessibilityRole="radiogroup">
        {t.plan.actions.map((x) => (
          <Chip role="radio" key={x} label={x} selected={action === x} onPress={() => setAction(x)} />
        ))}
      </View>
      <Field
        label={t.common.orTypeYourOwn}
        value={action}
        onChangeText={setAction}
        maxLength={80}
        placeholder={t.plan.actionExample}
      />
      <CharsLeft value={action} max={80} showAt={20} warnAt={10} />

      {error ? (
        <Text variant="small" tone="ember" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <Button label={submitLabel} onPress={submit} />
    </View>
  );
}
