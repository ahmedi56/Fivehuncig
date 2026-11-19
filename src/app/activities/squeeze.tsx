import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { CravingCheck } from '@/components/craving-check';
import { Guide } from '@/components/guide';
import { Ring } from '@/components/ring';
import { Button, Screen, Text, tap } from '@/components/ui';
import { guidePhase } from '@/domain/guide';
import { SQUEEZE_MS, SQUEEZE_ROUTINE, stepAt, type SqueezeMove } from '@/domain/activities';
import { formatClock } from '@/domain/time';
import { useNow } from '@/hooks/use-now';
import { useT } from '@/i18n';
import { space, usePalette } from '@/theme';

/** Squeeze: a 3-minute isometric routine for a desk, a car or a sofa, when walking away isn't possible. */
export default function Squeeze() {
  const t = useT();
  const p = usePalette();
  const now = useNow(500);
  const [startedAt, setStartedAt] = useState<number>();
  // "Done" ends the routine early and goes straight to the rating.
  const [ended, setEnded] = useState(false);
  const elapsed = startedAt === undefined ? 0 : now - startedAt;
  const at = stepAt(SQUEEZE_ROUTINE, elapsed);
  const done = startedAt !== undefined && (ended || at.done);
  const { step } = at;

  // A vibration marks each change between squeezing and resting.
  useEffect(() => {
    if (startedAt !== undefined && at.index > 0 && !done) tap(Haptics.ImpactFeedbackStyle.Medium);
  }, [at.index, startedAt, done]);

  return (
    <Screen edges={['bottom']} footer={
        <>
          <Guide tool="squeeze" phase={guidePhase({ started: startedAt !== undefined, elapsed, total: SQUEEZE_MS, done, ended })} />
          {startedAt !== undefined && !done ? <Button kind="secondary" label={t.common.done} onPress={() => setEnded(true)} /> : null}
        </>
      }>
      <CravingCheck tool="squeeze" done={done}>
        {startedAt === undefined ? (
          <>
            <Text>{t.squeeze.intro}</Text>
            <Button big label={t.squeeze.start} onPress={() => setStartedAt(Date.now())} />
            <Text variant="small" tone="soft">
              {t.squeeze.note}
            </Text>
          </>
        ) : (
          <View style={styles.center}>
            <Figure active={done || step.kind === 'rest' ? undefined : step.move} />
            <Text variant="title" style={styles.centerText} accessibilityLiveRegion="polite">
              {done ? (ended ? t.common.done : t.squeeze.done) : step.kind === 'rest' ? t.squeeze.rest : t.squeeze.moves[step.move].title}
            </Text>
            {!done && step.kind === 'move' ? (
              <Text style={styles.centerText}>{t.squeeze.moves[step.move].body}</Text>
            ) : null}
            {done ? null : (
              <Ring progress={1 - at.leftMs / step.ms} size={120} stroke={10} color={step.kind === 'rest' ? p.sky : p.lung}>
                <Text variant="stat" accessibilityLabel={t.squeeze.left(formatClock(at.leftMs))}>
                  {formatClock(at.leftMs)}
                </Text>
              </Ring>
            )}
          </View>
        )}
      </CravingCheck>
    </Screen>
  );
}

/** A still outline with the working muscles highlighted: nothing moves, so reduced motion needs nothing. */
function Figure({ active }: { active?: SqueezeMove }) {
  const p = usePalette();
  const hands = active === 'hands' || active === 'push' ? p.lung : p.line;
  return (
    <Svg width={120} height={150} viewBox="0 0 120 150" aria-hidden>
      <Circle cx={60} cy={18} r={12} stroke={p.line} strokeWidth={4} fill="none" />
      <Path d="M60 32v52" stroke={p.line} strokeWidth={4} strokeLinecap="round" />
      <Path d="M60 44L32 66M60 44l28 22" stroke={active === 'push' ? p.lung : p.line} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={30} cy={68} r={7} fill={hands} />
      <Circle cx={90} cy={68} r={7} fill={hands} />
      <Path d="M60 84l-20 26v30M60 84l20 26v30" stroke={active === 'legs' ? p.lung : p.line} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: space.md, paddingVertical: space.md },
  centerText: { textAlign: 'center' },
});
