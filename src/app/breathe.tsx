import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

import { NATIVE_DRIVER, useReduceMotion } from '@/components/surf-visuals';
import { CravingCheck } from '@/components/craving-check';
import { Guide } from '@/components/guide';
import { MedsNudge } from '@/components/meds-nudge';
import { Button, Panel, Screen, Text } from '@/components/ui';
import { guidePhase } from '@/domain/guide';
import { useT } from '@/i18n';
import { finishCraving } from '@/services/actions';
import { useWaves } from '@/services/sounds';
import { useAppStore } from '@/store/app-store';
import { radius, space, usePalette } from '@/theme';

/** 4 s in, 4 s hold, 6 s out. A longer out-breath calms the body. */
const PHASES = [
  { key: 'in', ms: 4000, to: 1 },
  { key: 'hold', ms: 4000, to: 1 },
  { key: 'out', ms: 6000, to: 0 },
] as const;
const ROUNDS = 4;
/** The one-tap craving from Today: about 2 minutes, long enough for most of a craving to pass. */
const QUICK_ROUNDS = 8;
const BREATH_MS = PHASES.reduce((sum, x) => sum + x.ms, 0);

export default function Breathe() {
  const p = usePalette();
  const t = useT();
  const router = useRouter();
  // `quick=1` (Today's craving button): starts at once, no rating, ends with "I made it" / "I smoked".
  const quick = useLocalSearchParams<{ quick?: string }>().quick === '1';
  const rounds = quick ? QUICK_ROUNDS : ROUNDS;
  const profile = useAppStore((s) => s.profile);
  const reasons = useAppStore((s) => s.reasons);
  // One of the member's own reasons, chosen once for this craving.
  const [pick] = useState(() => Math.floor(Math.random() * 1000));
  const reason = reasons.length ? reasons[pick % reasons.length] : undefined;
  const [outcome, setOutcome] = useState<'beaten' | 'smoked'>();
  const [scale] = useState(() => new Animated.Value(0));
  const [running, setRunning] = useState(quick);
  const [phase, setPhase] = useState(0);
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);
  // "Done" ends the exercise early and goes straight to the rating.
  const [ended, setEnded] = useState(false);
  // 260 px on a phone, smaller on narrow or zoomed screens.
  const stage = Math.min(260, useWindowDimensions().width - 2 * space.md);
  const reduceMotion = useReduceMotion();
  // Optional calm waves (Settings): one loop per breath, starting with the first breath in.
  useWaves(running);

  useEffect(() => {
    if (!running) return;
    const current = PHASES[phase];
    const anim = Animated.timing(scale, {
      toValue: current.to,
      duration: reduceMotion ? 0 : current.ms,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: NATIVE_DRIVER,
    });
    anim.start();
    const id = setTimeout(() => {
      if (phase < PHASES.length - 1) return setPhase(phase + 1);
      if (round + 1 >= rounds) {
        setRunning(false);
        setDone(true);
        return;
      }
      setRound(round + 1);
      setPhase(0);
    }, current.ms);
    return () => {
      anim.stop();
      clearTimeout(id);
    };
  }, [running, phase, round, rounds, scale, reduceMotion]);

  const elapsed = round * BREATH_MS + PHASES.slice(0, phase).reduce((sum, x) => sum + x.ms, 0);
  const size = scale.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const answer = async (beaten: boolean) => {
    setRunning(false);
    const event = await finishCraving(beaten, 'breathe');
    if (event && profile?.mode === 'quit') return router.replace({ pathname: '/slip', params: { smoke: event.id } });
    setOutcome(beaten ? 'beaten' : 'smoked');
  };

  if (quick) {
    const circle = (
      <View style={[styles.stage, { width: stage, height: stage }]}>
        <Animated.View style={[styles.circle, { width: stage, height: stage, backgroundColor: p.skySoft, borderColor: p.sky, transform: [{ scale: size }] }]} />
        <Text variant="heading" style={styles.label} accessibilityLiveRegion="polite">
          {done ? t.breathe.wellDone : t.breathe[PHASES[phase].key]}
        </Text>
      </View>
    );
    return (
      <Screen
        edges={['bottom']}
        footer={
          outcome ? (
            <Button label={t.common.done} onPress={leave} />
          ) : (
            <>
              <Guide tool="breathe" phase={guidePhase({ started: true, elapsed, total: rounds * BREATH_MS, done })} />
              <Button label={t.breathe.madeIt} onPress={() => answer(true)} />
              <Button kind="secondary" label={t.sos.smoked} onPress={() => answer(false)} />
            </>
          )
        }>
        {outcome ? (
          <View style={styles.center}>
            <Text variant="title" style={styles.label} accessibilityRole="header" accessibilityLiveRegion="polite">
              {outcome === 'beaten' ? t.sos.beatTitle : t.sos.okTitle}
            </Text>
            <Text tone="soft" style={styles.label}>
              {outcome === 'beaten' ? t.sos.beatBody : t.sos.okBody}
            </Text>
            {outcome === 'smoked' && profile?.mode === 'cutdown' ? <MedsNudge /> : null}
          </View>
        ) : (
          <View style={styles.center}>
            {circle}
            <Text tone="soft" style={styles.label}>
              {done ? t.breathe.notice : t.breathe.round(round + 1, rounds)}
            </Text>
            {/* Their own words, and their own photo, while the craving peaks. */}
            {reason ? (
              <Panel tone="sky" style={styles.reason}>
                {reason.photoUri ? <Image source={{ uri: reason.photoUri }} style={styles.photo} contentFit="cover" accessible={false} /> : null}
                <Text variant="small" tone="soft">
                  {t.today.why}
                </Text>
                <Text variant="heading" followContent>
                  {reason.text}
                </Text>
              </Panel>
            ) : null}
            <Button kind="quiet" label={t.breathe.otherWays} onPress={() => router.replace('/sos')} />
          </View>
        )}
      </Screen>
    );
  }

  return (
    <Screen
      edges={['bottom']}
      footer={
        <>
          <Guide tool="breathe" phase={guidePhase({ started: running || done, elapsed, total: rounds * BREATH_MS, done, ended })} />
          {running ? (
            <Button
              kind="secondary"
              label={t.common.done}
              onPress={() => {
                setRunning(false);
                setEnded(true);
                setDone(true);
              }}
            />
          ) : null}
        </>
      }>
      <CravingCheck tool="breathe" done={done}>
        <View style={styles.center}>
          <View style={[styles.stage, { width: stage, height: stage }]}>
            <Animated.View style={[styles.circle, { width: stage, height: stage, backgroundColor: p.skySoft, borderColor: p.sky, transform: [{ scale: size }] }]} />
            <Text variant="heading" style={styles.label} accessibilityLiveRegion="polite">
              {done ? (ended ? t.common.done : t.breathe.wellDone) : running ? t.breathe[PHASES[phase].key] : t.breathe.ready}
            </Text>
          </View>
          <Text tone="soft" style={{ textAlign: 'center' }}>
            {done ? t.breathe.notice : running ? t.breathe.round(round + 1, rounds) : t.breathe.intro}
          </Text>
          {!running ? (
            <Button
              label={done ? t.common.again : t.common.start}
              onPress={() => {
                setDone(false);
                setEnded(false);
                setRound(0);
                setPhase(0);
                setRunning(true);
              }}
            />
          ) : null}
        </View>
      </CravingCheck>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: space.lg, paddingTop: space.lg },
  stage: { alignItems: 'center', justifyContent: 'center' },
  circle: { position: 'absolute', borderRadius: radius.pill, borderWidth: 3 },
  label: { textAlign: 'center' },
  reason: { alignSelf: 'stretch', gap: space.xs },
  photo: { width: '100%', height: 160, borderRadius: radius.md },
});
