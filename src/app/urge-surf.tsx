import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { FEATURES } from '@/config/features';
import { CravingScale } from '@/components/craving-scale';
import { Guide } from '@/components/guide';
import { Ring } from '@/components/ring';
import { BreathCircle, Wave } from '@/components/surf-visuals';
import { Button, Chip, Field, Illustration, Screen, Text } from '@/components/ui';
import { VideoCard } from '@/components/video-card';
import { urgeSurfVideos } from '@/content/videos';
import { guidePhase } from '@/domain/guide';
import { formatClock } from '@/domain/time';
import { BODY_AREAS, type BodyArea, type CravingTrend, type Helped } from '@/domain/types';
import { cleanText } from '@/domain/validate';
import { useLang, useT } from '@/i18n';
import { recordRating } from '@/services/actions';
import { useWaves } from '@/services/sounds';
import { useAppStore } from '@/store/app-store';
import { useSosSession } from '@/store/sos-session';
import { radius, space, usePalette } from '@/theme';

/**
 * Guided urge surfing: notice → breathe → watch the wave → observe → ride it → check in.
 * Works fully offline and without video or animation. Nothing is saved unless the member finishes.
 */
const STEPS = ['notice', 'breathe', 'wave', 'observe', 'ride', 'reflect', 'check'] as const;
type Step = 'intro' | (typeof STEPS)[number] | 'result';

const RIDE_MS = 90_000;

export default function UrgeSurf() {
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromChat = from === 'chat';
  const videos = urgeSurfVideos(lang);

  const [step, setStep] = useState<Step>('intro');
  const [startedAt, setStartedAt] = useState(0);
  const [area, setArea] = useState<BodyArea>();
  // Starts from the answer on the SOS screen, if there was one; the exercise still lets you change it.
  const [before, setBefore] = useState<number | undefined>(() => useSosSession.getState().cravingLevel);
  const [trend, setTrend] = useState<CravingTrend>();
  const [after, setAfter] = useState<number>();
  const [helped, setHelped] = useState<Helped>();
  const [reflection, setReflection] = useState('');
  // "Done" skips the rest of the steps and goes straight to the check-in.
  const [ended, setEnded] = useState(false);
  // Optional calm waves (Settings) while breathing, watching the wave and riding it out.
  useWaves(step === 'breathe' || step === 'wave' || step === 'ride');

  const index = STEPS.indexOf(step as (typeof STEPS)[number]);
  const go = (next: Step) => setStep(next);
  const nextStep = () => go(index < STEPS.length - 1 ? STEPS[index + 1] : 'result');

  const finish = () => {
    if (after === undefined || !helped) return;
    const note = cleanText(reflection, 200);
    useAppStore.getState().logSurf({ at: Date.now(), startedAt, bodyArea: area, before, after, trend, helped, ...(note ? { reflection: note } : {}) });
    // The exercise already asks before and after: it counts as a rating, with the same follow-up.
    recordRating('urge-surf', after, before);
    useSosSession.getState().setCravingLevel(after);
    useSosSession.getState().pickTool('urge-surf');
    if (fromChat) useSosSession.getState().setSurfResult({ before, after, helped });
    go('result');
  };

  const restart = () => {
    setArea(undefined);
    setBefore(undefined);
    setTrend(undefined);
    setAfter(undefined);
    setHelped(undefined);
    setEnded(false);
    setStartedAt(Date.now());
    go('notice');
  };

  // The steps stand in for time: the check-in is the last stretch, the result is "after".
  const guide = (
    <Guide
      tool="urge-surf"
      phase={guidePhase({ started: step !== 'intro', elapsed: Math.max(0, index), total: STEPS.length - 1, done: step === 'result', ended })}
    />
  );

  if (step === 'intro') {
    return (
      <Screen edges={['bottom']} footer={guide}>
        <Illustration>🌊</Illustration>
        <Text variant="title" accessibilityRole="header">
          {t.surf.introTitle}
        </Text>
        <Text>{t.surf.introBody}</Text>
        <Button big label={t.surf.start} onPress={restart} />
        {videos.length ? (
          <View style={{ gap: space.sm }}>
            <Text variant="heading">{t.surf.videos.title}</Text>
            {videos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </View>
        ) : null}
      </Screen>
    );
  }

  if (step === 'result') {
    const dropped = before !== undefined && after !== undefined && after < before;
    const worked = helped === 'yes' || helped === 'little';
    return (
      <Screen edges={['bottom']} footer={guide}>
        <Illustration>🏄</Illustration>
        <Text variant="title" accessibilityRole="header" accessibilityLiveRegion="polite">
          {dropped ? t.surf.result.dropped(before!, after!) : t.surf.result.stayed}
        </Text>
        <Text tone="soft">{worked ? t.surf.result.helped : t.surf.result.notYet}</Text>
        {fromChat ? (
          <Button big label={t.surf.result.backToChat} onPress={() => router.back()} />
        ) : (
          <>
            {!worked && FEATURES.chat ? <Button big label={t.surf.result.talk} onPress={() => router.replace('/chat')} /> : null}
            <Button kind={worked ? 'primary' : 'secondary'} label={t.surf.result.progress} onPress={() => router.navigate('/progress')} />
            <Button kind="secondary" label={t.surf.result.otherTool} onPress={() => router.navigate('/sos')} />
            <Button kind="quiet" label={t.surf.result.again} onPress={restart} />
          </>
        )}
      </Screen>
    );
  }

  return (
    <Screen
      edges={['bottom']}
      footer={
        <>
          {guide}
          {step === 'check' ? null : (
            <Button
              kind="secondary"
              label={t.common.done}
              onPress={() => {
                setEnded(true);
                go('check');
              }}
            />
          )}
        </>
      }>
      <Text variant="small" tone="soft">
        {t.surf.stepOf(index + 1, STEPS.length)}
      </Text>
      <Progress index={index} />

      {step === 'notice' ? (
        <>
          <Text variant="title" accessibilityRole="header">
            {t.surf.notice.title}
          </Text>
          <Text>{t.surf.notice.where}</Text>
          <View style={styles.chips}>
            {BODY_AREAS.map((a) => (
              <Chip key={a} label={t.surf.notice.areas[a]} selected={area === a} onPress={() => setArea(area === a ? undefined : a)} />
            ))}
          </View>
          <Text variant="bodyStrong">{t.surf.notice.rate}</Text>
          <CravingScale value={before} onChange={setBefore} />
          <Button big label={t.surf.next} onPress={nextStep} />
        </>
      ) : null}

      {step === 'breathe' ? (
        <>
          <Text variant="title" accessibilityRole="header">
            {t.surf.breathe.title}
          </Text>
          <Text>{t.surf.breathe.body}</Text>
          <BreathCircle labels={{ in: t.surf.breathe.in, hold: t.surf.breathe.hold, out: t.surf.breathe.out }} secondsLabel={t.surf.breathe.seconds} />
          <Button big label={t.surf.next} onPress={nextStep} />
        </>
      ) : null}

      {step === 'wave' ? (
        <>
          <Text variant="title" accessibilityRole="header">
            {t.surf.wave.title}
          </Text>
          <Wave label={t.surf.wave.a11y} />
          <Text>{t.surf.wave.body}</Text>
          <Button big label={t.surf.next} onPress={nextStep} />
        </>
      ) : null}

      {step === 'observe' ? (
        <>
          <Text variant="title" accessibilityRole="header">
            {t.surf.observe.title}
          </Text>
          <Text>{t.surf.observe.body}</Text>
          <View style={styles.choices}>
            {(
              [
                ['weaker', '↓', t.surf.observe.weaker],
                ['same', '→', t.surf.observe.same],
                ['stronger', '↑', t.surf.observe.stronger],
              ] as const
            ).map(([key, arrow, label]) => (
              <Button key={key} style={{ flex: 1 }} kind={trend === key ? 'primary' : 'secondary'} label={`${arrow} ${label}`} onPress={() => setTrend(key)} />
            ))}
          </View>
          {trend === 'stronger' ? (
            <Text tone="soft" accessibilityLiveRegion="polite">
              {t.surf.observe.strongerNote}
            </Text>
          ) : null}
          <Button big label={t.surf.next} onPress={nextStep} />
        </>
      ) : null}

      {step === 'ride' ? <Ride onNext={nextStep} /> : null}

      {/* "What did it actually feel like?" Remembering the real taste loosens the pull (Brewer). */}
      {step === 'reflect' ? (
        <>
          <Text variant="title" accessibilityRole="header">
            {t.surf.reflect.title}
          </Text>
          <Text>{t.surf.reflect.body}</Text>
          <Field label={t.surf.reflect.label} value={reflection} onChangeText={setReflection} maxLength={200} multiline placeholder={t.surf.reflect.placeholder} />
          <Button big label={t.surf.next} onPress={nextStep} />
        </>
      ) : null}

      {step === 'check' ? (
        <>
          <Text variant="title" accessibilityRole="header">
            {t.surf.check.title}
          </Text>
          <Text variant="bodyStrong">{t.surf.check.now}</Text>
          <CravingScale value={after} onChange={setAfter} />
          <Text variant="bodyStrong">{t.surf.check.helped}</Text>
          <View style={styles.choices}>
            {(
              [
                ['yes', t.surf.check.yes],
                ['little', t.surf.check.little],
                ['not-yet', t.surf.check.notYet],
              ] as const
            ).map(([key, label]) => (
              <Button key={key} style={{ flex: 1 }} kind={helped === key ? 'primary' : 'secondary'} label={label} onPress={() => setHelped(key)} />
            ))}
          </View>
          <Button big label={t.surf.check.finish} disabled={after === undefined || !helped} onPress={finish} />
        </>
      ) : null}
    </Screen>
  );
}

/** One small segment per step: where am I in the exercise. Not color-only: the "Step x of y" text says it too. */
function Progress({ index }: { index: number }) {
  const p = usePalette();
  return (
    <View style={styles.progress} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {STEPS.map((s, i) => (
        <View key={s} style={[styles.segment, { backgroundColor: i <= index ? p.lung : p.surfaceAlt }]} />
      ))}
    </View>
  );
}

/** "Ride it": a 90-second timer that can be paused, extended, or skipped; pauses in the background. */
function Ride({ onNext }: { onNext: () => void }) {
  const t = useT();
  const p = usePalette();
  const [total, setTotal] = useState(RIDE_MS);
  const [left, setLeft] = useState(RIDE_MS);
  const [running, setRunning] = useState(true);
  const last = useRef(0);

  useEffect(() => {
    if (!running) return;
    last.current = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const delta = now - last.current;
      last.current = now;
      setLeft((l) => Math.max(0, l - delta));
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') setRunning(false);
    });
    return () => sub.remove();
  }, []);

  const done = left === 0;
  return (
    <>
      <Text variant="title" accessibilityRole="header">
        {t.surf.ride.title}
      </Text>
      <Text>{t.surf.ride.body}</Text>
      <View style={{ alignItems: 'center' }}>
        <Ring progress={1 - left / total} size={200} color={p.sky}>
          <Text variant="display" style={{ textAlign: 'center' }} accessibilityLabel={done ? t.surf.ride.done : t.surf.ride.left(formatClock(left))}>
            {formatClock(left)}
          </Text>
        </Ring>
      </View>
      {done ? (
        <Text variant="bodyStrong" style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">
          {t.surf.ride.done}
        </Text>
      ) : (
        <View style={styles.choices}>
          <Button style={{ flex: 1 }} kind="secondary" label={running ? t.surf.ride.pause : t.surf.ride.resume} onPress={() => setRunning(!running)} />
          <Button
            style={{ flex: 1 }}
            kind="secondary"
            label={t.surf.ride.more}
            onPress={() => {
              setTotal((x) => x + 30_000);
              setLeft((l) => l + 30_000);
            }}
          />
        </View>
      )}
      <Button big kind={done ? 'primary' : 'secondary'} label={t.surf.next} onPress={onNext} />
    </>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  choices: { flexDirection: 'row', gap: space.sm },
  progress: { flexDirection: 'row', gap: space.xs },
  segment: { flex: 1, height: 6, borderRadius: radius.xs },
});
