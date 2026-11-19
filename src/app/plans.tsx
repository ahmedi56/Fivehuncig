import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { ConfirmButton } from '@/components/confirm-button';
import { PlanBuilder, type PlanDraft } from '@/components/plan-builder';
import { Panel, Row, Screen, Text } from '@/components/ui';
import { isTriggerId } from '@/domain/types';
import { useT } from '@/i18n';
import { REMINDER_TIMES } from '@/domain/notify';
import { syncReminder } from '@/services/actions';
import { MAX_PLANS, useAppStore } from '@/store/app-store';
import { space } from '@/theme';

const pad = (n: number) => String(n).padStart(2, '0');

export default function Plans() {
  const t = useT();
  const router = useRouter();
  const plans = useAppStore((s) => s.plans);
  const reminderKey = useAppStore((s) => s.reminder);
  const reminder = REMINDER_TIMES.find((x) => x.key === reminderKey);
  const muted = useAppStore((s) => !!s.notificationsMuted);
  // Slip rescue can open this screen with the trigger it just recorded. Params are untrusted: only known ids count.
  const { trigger } = useLocalSearchParams<{ trigger?: string }>();
  const initialTrigger = isTriggerId(trigger) ? t.plan.fromTrigger[trigger] : '';

  const add = async (draft: PlanDraft) => {
    const same = (x: string, y: string) => x.trim().toLowerCase() === y.trim().toLowerCase();
    if (plans.some((p) => same(p.trigger, draft.trigger) && same(p.action, draft.action))) return t.plans.duplicate;
    const created = useAppStore.getState().addPlan(draft);
    if (!created) return t.plans.full(MAX_PLANS);
    // The one daily reminder shows the newest plan.
    await syncReminder();
  };

  const remove = async (id: string) => {
    useAppStore.getState().removePlan(id);
    await syncReminder();
  };

  return (
    <Screen edges={['bottom']}>
      <Text tone="soft">{t.plans.intro}</Text>

      {plans.length === 0 ? (
        <Panel tone="sky">
          <Text>{t.plans.empty}</Text>
        </Panel>
      ) : (
        <View style={{ gap: space.sm }}>
          {plans.map((plan) => (
            <Panel key={plan.id}>
              <Text variant="bodyStrong">{t.plan.sentence(plan.trigger, plan.action)}</Text>
              <ConfirmButton
                label={t.common.delete}
                confirmLabel={t.common.deleteConfirm}
                onConfirm={() => remove(plan.id)}
              />
            </Panel>
          ))}
          <Row
            icon="bell"
            title={muted ? t.settings.muted : reminder ? t.plans.reminderAt(`${pad(reminder.hour)}:${pad(reminder.minute)}`) : t.plans.reminderNone}
            subtitle={t.plans.reminderChange}
            onPress={() => router.push('/settings')}
          />
        </View>
      )}

      {plans.length >= MAX_PLANS ? (
        <Panel tone="sky">
          <Text>{t.plans.full(MAX_PLANS)}</Text>
        </Panel>
      ) : (
        <>
          <Text variant="title">{t.plans.newPlan}</Text>
          <PlanBuilder key={initialTrigger} initialTrigger={initialTrigger} submitLabel={t.plans.save} onSubmit={add} />
        </>
      )}
    </Screen>
  );
}
