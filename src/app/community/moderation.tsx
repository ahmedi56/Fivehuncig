import { Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FEATURES } from '@/config/features';
import { ErrorPanel, timeAgo } from '@/components/community';
import { ConfirmButton } from '@/components/confirm-button';
import { Button, Panel, Screen, Text } from '@/components/ui';
import { useLang, useT } from '@/i18n';
import { community, type CommunityError, type ModReport } from '@/services/community';
import { space } from '@/theme';

/**
 * Moderation queue. Shown only to moderators, but that is just convenience: every action is
 * refused by the database unless the caller's profile has the moderator role.
 * Self-harm concerns are listed first.
 */
function ModerationScreen() {
  const t = useT();
  const lang = useLang();
  const [reports, setReports] = useState<ModReport[]>();
  const [error, setError] = useState<CommunityError>();
  const [done, setDone] = useState<number>();

  const load = useCallback(() => {
    community.modReports().then((r) => {
      if (!r.ok) return setError(r.error);
      setError(undefined);
      setReports(r.data);
    });
  }, []);
  useFocusEffect(load);

  const act = async (fn: () => ReturnType<typeof community.modDismiss>, reportId: number) => {
    const r = await fn();
    if (!r.ok) return setError(r.error);
    setDone(reportId);
    load();
  };

  if (error) return <Screen edges={['bottom']}><ErrorPanel error={error} onRetry={load} /></Screen>;

  return (
    <Screen edges={['bottom']}>
      {done ? <Text tone="lung" accessibilityLiveRegion="polite">{t.community.moderation.done}</Text> : null}
      {reports && reports.length === 0 ? <Text tone="soft">{t.community.moderation.empty}</Text> : null}
      {(reports ?? []).map((r) => (
        <Panel key={r.report_id} tone={r.reason === 'self_harm' ? 'ember' : 'surface'}>
          <Text variant="bodyStrong">
            {t.community.reportSheet.reasons[r.reason]} · {t.community.moderation.reportsOn(r.reports_on_target)} · {timeAgo(r.created_at, t, lang)}
          </Text>
          {r.note ? <Text variant="small">“{r.note}”</Text> : null}
          <Text>{r.content ?? '—'}</Text>
          <Text variant="small" tone="soft">
            {t.community.moderation.by(r.author_nickname ?? '—', r.author_warnings ?? 0)} · {r.content_status}
          </Text>
          <View style={styles.row}>
            <Button kind="secondary" label={t.community.moderation.dismiss} onPress={() => act(() => community.modDismiss(r.report_id), r.report_id)} />
            <Button kind="secondary" label={t.community.moderation.hide} onPress={() => act(() => community.modSetStatus(r.target_type, r.target_id, 'hidden'), r.report_id)} />
            <Button kind="secondary" label={t.community.moderation.restore} onPress={() => act(() => community.modSetStatus(r.target_type, r.target_id, 'visible'), r.report_id)} />
            <ConfirmButton label={t.community.moderation.remove} confirmLabel={t.common.deleteConfirm} onConfirm={() => act(() => community.modSetStatus(r.target_type, r.target_id, 'removed'), r.report_id)} />
          </View>
          {r.author_id ? (
            <View style={styles.row}>
              <Button kind="quiet" label={t.community.moderation.warn} onPress={() => act(() => community.modActOnUser(r.author_id!, 'warn'), r.report_id)} />
              <Button kind="quiet" label={t.community.moderation.restrict} onPress={() => act(() => community.modActOnUser(r.author_id!, 'restrict', 3), r.report_id)} />
              <ConfirmButton label={t.community.moderation.ban} confirmLabel={t.common.deleteConfirm} onConfirm={() => act(() => community.modActOnUser(r.author_id!, 'ban'), r.report_id)} />
            </View>
          ) : null}
        </Panel>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});

/** Left out of the test release (see src/config/features.ts): back to Today. */
export default function Moderation() {
  return FEATURES.community ? <ModerationScreen /> : <Redirect href="/" />;
}
