import { Redirect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FEATURES } from '@/config/features';
import { CravingCheck } from '@/components/craving-check';
import { Guide } from '@/components/guide';
import { Button, Screen, Text, tap } from '@/components/ui';
import { guidePhase } from '@/domain/guide';
import { BUBBLES, newSequence, nextLength, PATTERN_MS, START_LENGTH, tapBubble, type PatternRound, type TapResult } from '@/domain/pattern';
import { formatClock } from '@/domain/time';
import { useNow } from '@/hooks/use-now';
import { playEffect, playNote } from '@/services/sounds';
import { useT } from '@/i18n';
import { radius, space, usePalette } from '@/theme';

const LIT_MS = 600;
const GAP_MS = 250;
const FEEDBACK_MS = 1100;

type Phase = 'watch' | 'input' | 'feedback';

/**
 * Pattern Pop (was Bubble pop): watch a sequence light up, then pop it back in order. Each bubble
 * has its own note, so the sequence is also a short tune to remember. Lighting up is a colour
 * change, not movement, so it stays the same with reduced motion.
 */
function PatternPopScreen() {
  const t = useT();
  const p = usePalette();
  const now = useNow(500);
  const [startedAt, setStartedAt] = useState<number>();
  // "Done" ends the session early and goes straight to the rating.
  const [ended, setEnded] = useState(false);
  const [length, setLength] = useState(START_LENGTH);
  const [round, setRound] = useState<PatternRound>(() => ({ sequence: newSequence(START_LENGTH), popped: 0 }));
  const [phase, setPhase] = useState<Phase>('watch');
  const [lit, setLit] = useState<number>();
  const [last, setLast] = useState<TapResult>();
  const elapsed = startedAt === undefined ? 0 : now - startedAt;
  const done = startedAt !== undefined && (ended || elapsed >= PATTERN_MS);

  // Play the sequence: each bubble lights up in turn, then it's the member's turn.
  useEffect(() => {
    if (startedAt === undefined || done || phase !== 'watch') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    round.sequence.forEach((bubble, i) => {
      timers.push(
        setTimeout(() => {
          setLit(bubble);
          playNote(bubble);
        }, i * (LIT_MS + GAP_MS)),
      );
      timers.push(setTimeout(() => setLit(undefined), i * (LIT_MS + GAP_MS) + LIT_MS));
    });
    timers.push(setTimeout(() => setPhase('input'), round.sequence.length * (LIT_MS + GAP_MS)));
    return () => timers.forEach(clearTimeout);
  }, [startedAt, done, phase, round.sequence]);

  // After a round: a short message, then the next sequence, one longer or one shorter.
  useEffect(() => {
    if (phase !== 'feedback' || done || !last || last === 'continue') return;
    const id = setTimeout(() => {
      const next = nextLength(length, last);
      setLength(next);
      setRound({ sequence: newSequence(next), popped: 0 });
      setPhase('watch');
    }, FEEDBACK_MS);
    return () => clearTimeout(id);
  }, [phase, done, last, length]);

  const pop = (bubble: number) => {
    if (phase !== 'input' || done) return;
    const result = tapBubble(round, bubble);
    setRound(result.round);
    if (result.result === 'miss') playEffect('miss');
    else playNote(bubble);
    if (result.result === 'continue') return tap();
    if (result.result === 'done') playEffect('chime');
    tap(result.result === 'done' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    setLast(result.result);
    setPhase('feedback');
  };

  const status = done ? (ended ? t.common.done : t.pattern.done) : phase === 'watch' ? t.pattern.watch : phase === 'input' ? t.pattern.yourTurn : last === 'done' ? t.pattern.great : t.pattern.miss;

  return (
    <Screen edges={['bottom']} footer={
        <>
          <Guide tool="pattern" phase={guidePhase({ started: startedAt !== undefined, elapsed, total: PATTERN_MS, done, ended })} />
          {startedAt !== undefined && !done ? <Button kind="secondary" label={t.common.done} onPress={() => setEnded(true)} /> : null}
        </>
      }>
      <CravingCheck tool="pattern" done={done}>
        {startedAt === undefined ? (
          <>
            <Text>{t.pattern.intro}</Text>
            <Button big label={t.pattern.start} onPress={() => setStartedAt(Date.now())} />
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Text variant="bodyStrong">{t.pattern.length(length)}</Text>
              <Text tone="soft">{done ? '' : t.pattern.left(formatClock(PATTERN_MS - elapsed))}</Text>
            </View>
            <Text variant="heading" style={styles.center} accessibilityLiveRegion="polite">
              {status}
            </Text>
            <View style={[styles.grid, { direction: 'ltr' }]}>
              {Array.from({ length: BUBBLES }, (_, i) => {
                const on = lit === i;
                return (
                  <Pressable
                    key={i}
                    accessibilityRole="button"
                    accessibilityLabel={t.pattern.bubble(i + 1)}
                    aria-disabled={phase !== 'input' || done}
                    onPress={() => pop(i)}
                    style={[styles.bubble, { backgroundColor: on ? p.lung : p.skySoft, borderColor: on ? p.lung : p.sky }]}
                  />
                );
              })}
            </View>
          </>
        )}
      </CravingCheck>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  center: { textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, justifyContent: 'center', maxWidth: 320, alignSelf: 'center' },
  bubble: { width: 84, height: 84, borderRadius: radius.pill, borderWidth: 3 },
});

/** Hidden for the test release (see src/config/features.ts): back to Today. */
export default function PatternPop() {
  return FEATURES.extras ? <PatternPopScreen /> : <Redirect href="/" />;
}
