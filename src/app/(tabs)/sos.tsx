import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';

import { FEATURES } from '@/config/features';
import { AfterCheck } from '@/components/craving-check';
import { Icon, type IconName } from '@/components/icons';
import { MedsNudge } from '@/components/meds-nudge';
import { Ring } from '@/components/ring';
import { Button, Chip, Illustration, Panel, pressedStyle, Row, Screen, Text } from '@/components/ui';
import { bestTool, orderTools, roundDrop, SOS_SLOTS, type RatedTool } from '@/domain/ratings';
import { formatClock } from '@/domain/time';
import { TRIGGERS, type CravingTool, type TriggerId } from '@/domain/types';
import { useNow } from '@/hooks/use-now';
import { formatDecimal, useLang, useT, type Messages } from '@/i18n';
import { recordSmoke, undoSmoke } from '@/services/actions';
import { useAppStore } from '@/store/app-store';
import { useSosSession } from '@/store/sos-session';
import { radius, space, usePalette } from '@/theme';

const DELAY_MS = 5 * 60_000;

/**
 * Default order: exercise first (strongest evidence, docs/RESEARCH_QUIT_EVIDENCE.md section 3), then
 * the two that work anywhere. Only the first SOS_SLOTS show; the member's own ratings reorder them.
 */
type SosTool = { key: keyof Messages['sos']['tools']; rated: RatedTool; tool: CravingTool; icon: IconName; href: Href };
const TOOLS: SosTool[] = [
  { key: 'move', rated: 'move', tool: 'move', icon: 'walk', href: '/activities/move' },
  { key: 'squeeze', rated: 'squeeze', tool: 'squeeze', icon: 'fist', href: '/activities/squeeze' },
  { key: 'breathe', rated: 'breathe', tool: 'breathe', icon: 'wind', href: '/breathe' },
  { key: 'blocks', rated: 'blocks', tool: 'game', icon: 'blocks', href: '/games/block-drop' },
  { key: 'memory', rated: 'memory', tool: 'game', icon: 'cards', href: '/games/memory' },
  { key: 'pattern', rated: 'pattern', tool: 'game', icon: 'bubbles', href: '/games/bubbles' },
  { key: 'urgeSurf', rated: 'urge-surf', tool: 'urge-surf', icon: 'wave', href: '/urge-surf' },
  { key: 'imagery', rated: 'imagery', tool: 'imagery', icon: 'sunrise', href: '/activities/imagery' },
];
// Puzzle games and guided imagery are hidden for the test release (src/config/features.ts).
const EXTRA_TOOLS: SosTool['key'][] = ['blocks', 'memory', 'pattern', 'imagery'];
const SHOWN_TOOLS = TOOLS.filter((x) => FEATURES.extras || !EXTRA_TOOLS.includes(x.key));

export default function Sos() {
  const router = useRouter();
  const now = useNow();
  const p = usePalette();
  const t = useT();
  const lang = useLang();
  const { delayEndsAt, tool, startDelay, pickTool, end } = useSosSession();
  const profile = useAppStore((s) => s.profile);
  const reasons = useAppStore((s) => s.reasons);
  const ratings = useAppStore((s) => s.ratings);
  const hasPlans = useAppStore((s) => s.plans.length > 0);
  const [moreTools, setMoreTools] = useState(false);
  const [water, setWater] = useState(false);
  const [trigger, setTrigger] = useState<TriggerId>();
  const [result, setResult] = useState<'beaten' | 'smoked'>();
  // What the last outcome logged, so a mistaken tap can be undone from the result screen.
  const [logged, setLogged] = useState<{ craving: string; smoke?: string }>();

  // Best tool first once it has enough ratings; tools that didn't help move to the end.
  const best = bestTool(ratings);
  const ordered = orderTools(
    SHOWN_TOOLS.map((x) => x.rated),
    ratings,
  ).map((rated) => SHOWN_TOOLS.find((x) => x.rated === rated)!);

  const remaining = delayEndsAt ? delayEndsAt - now : 0;
  const delaying = remaining > 0;
  const delayDone = delayEndsAt !== undefined && !delaying;

  // The ring is silent: tell screen readers when the 5 minutes are up (once, on the change).
  const wasDelaying = useRef(false);
  useEffect(() => {
    if (wasDelaying.current && delayDone) AccessibilityInfo.announceForAccessibility(t.sos.delayDone);
    wasDelaying.current = delaying;
  }, [delaying, delayDone, t]);

  const finish = async (beaten: boolean) => {
    const craving = useAppStore.getState().logCraving(beaten, tool, Date.now(), trigger);
    end();
    setWater(false);
    setTrigger(undefined);
    setResult(beaten ? 'beaten' : 'smoked');
    setLogged({ craving: craving.id });
    if (!beaten) {
      const event = await recordSmoke(trigger);
      setLogged({ craving: craving.id, smoke: event.id });
      if (profile?.mode === 'quit') router.push({ pathname: '/slip', params: { smoke: event.id } });
    }
  };

  /** A wrong tap at a hard moment: remove what was just logged and go back to the tools. */
  const undo = async () => {
    if (logged) {
      useAppStore.getState().removeCraving(logged.craving);
      if (logged.smoke) await undoSmoke(logged.smoke);
    }
    setLogged(undefined);
    setResult(undefined);
  };

  if (result) {
    return (
      <Screen>
        <View style={[styles.center, { paddingTop: space.xxl * 2 }]}>
          <Illustration>{result === 'beaten' ? '🌊' : '🤝'}</Illustration>
          <Text variant="title" style={styles.centerText} accessibilityLiveRegion="polite">
            {result === 'beaten' ? t.sos.beatTitle : t.sos.okTitle}
          </Text>
          <Text tone="soft" style={styles.centerText}>
            {result === 'beaten' ? t.sos.beatBody : t.sos.okBody}
          </Text>
          <Button
            label={t.common.done}
            onPress={() => {
              setLogged(undefined);
              setResult(undefined);
            }}
          />
          {logged ? <Button kind="quiet" label={t.common.undo} onPress={undo} /> : null}
        </View>
        {/* Quit mode gets the same card on slip rescue; cut-down members see it here. */}
        {result === 'smoked' && profile?.mode === 'cutdown' ? <MedsNudge /> : null}
        {/* Plans are introduced here, after a first craving, rather than during onboarding. */}
        {hasPlans ? null : <Row icon="target" title={t.sos.planNudge} subtitle={t.sos.planNudgeSub} onPress={() => router.push('/plans')} />}
      </Screen>
    );
  }

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">
        {t.sos.title}
      </Text>
      <Text tone="soft">{t.sos.intro}</Text>

      {/* Left out of the test release unless the build turns it on (src/config/features.ts). */}
      {FEATURES.chat ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t.chat.entry}. ${t.chat.entrySubtitle}`}
          onPress={() => {
            pickTool('chat');
            router.push('/chat');
          }}
          style={({ pressed }) => [styles.chatEntry, { backgroundColor: p.lung }, pressed && pressedStyle]}>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Icon name="chat" color={p.onLung} size={28} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="heading" tone="onLung">
              {t.chat.entry}
            </Text>
            <Text variant="small" tone="onLung">
              {t.chat.entrySubtitle}
            </Text>
          </View>
        </Pressable>
      ) : null}

      {FEATURES.community ? (
        <Row
          icon="community"
          title={t.community.support.community}
          subtitle={t.community.support.communitySub}
          onPress={() => router.push({ pathname: '/community/new', params: { type: 'craving' } })}
        />
      ) : null}

      <View style={styles.center}>
        <Ring progress={delaying ? 1 - remaining / DELAY_MS : delayDone ? 1 : 0} size={200} color={p.sky}>
          <Text
            variant="display"
            style={styles.centerText}
            // The ✓ would be read as "check mark"; the label below already says the delay is done.
            aria-hidden={delayDone}
            accessibilityLabel={delaying ? t.sos.minutesLeft(Math.ceil(remaining / 60_000)) : undefined}>
            {delaying ? formatClock(remaining) : delayDone ? '✓' : formatClock(DELAY_MS)}
          </Text>
          <Text variant="small" tone="soft" style={styles.centerText}>
            {delaying ? t.sos.waitPass : delayDone ? t.sos.delayDone : t.sos.delay}
          </Text>
        </Ring>
        {/* Cravings often outlast 5 minutes: the delay can always be started again. */}
        {!delayEndsAt ? (
          <Button label={t.sos.startDelay} onPress={() => startDelay()} />
        ) : delayDone ? (
          <Button label={t.sos.moreDelay} onPress={() => startDelay()} />
        ) : (
          <Button kind="quiet" label={t.sos.restartDelay} onPress={() => startDelay()} />
        )}
      </View>
      {delayDone ? <AfterCheck key={delayEndsAt} tool="delay" /> : null}

      <View>
        {(moreTools ? ordered : ordered.slice(0, SOS_SLOTS)).map((item) => (
          <Row
            key={item.key}
            icon={item.icon}
            title={t.sos.tools[item.key].title}
            subtitle={
              best?.tool === item.rated
                ? t.ratings.best(t.ratings.tools[best.tool], formatDecimal(roundDrop(best.averageDrop), lang), best.uses)
                : t.sos.tools[item.key].subtitle
            }
            onPress={() => {
              pickTool(item.tool);
              router.push(item.href);
            }}
          />
        ))}
        {moreTools ? (
          <Row
            icon="water"
            title={water ? t.sos.waterDone : t.sos.water}
            subtitle={water ? t.common.done : t.sos.waterSubtitle}
            onPress={() => {
              setWater(true);
              pickTool('water');
            }}
          />
        ) : null}
        <Button kind="quiet" label={moreTools ? t.sos.fewerTools : t.sos.otherTools} onPress={() => setMoreTools(!moreTools)} />
        <Row
          icon="image"
          title={t.sos.reasons}
          subtitle={reasons.length ? t.sos.reasonsCount(reasons.length) : profile?.mode === 'quit' ? t.sos.reasonsEmptyQuit : t.sos.reasonsEmpty}
          onPress={() => router.push('/reasons')}
        />
      </View>

      <Panel>
        <Text variant="bodyStrong">{t.triggers.question}</Text>
        <View style={styles.chips}>
          {TRIGGERS.map((id) => (
            <Chip
              key={id}
              label={t.triggers[id]}
              selected={trigger === id}
              onPress={() => setTrigger(trigger === id ? undefined : id)}
            />
          ))}
        </View>
      </Panel>

      <Panel>
        <Text variant="bodyStrong">{t.sos.howDidItGo}</Text>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button style={{ flex: 1 }} label={t.sos.passed} onPress={() => finish(true)} />
          <Button style={{ flex: 1 }} kind="secondary" label={t.sos.smoked} onPress={() => finish(false)} />
        </View>
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  centerText: { textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chatEntry: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, minHeight: 64 },
});
