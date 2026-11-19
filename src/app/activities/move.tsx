import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CravingCheck } from '@/components/craving-check';
import { Guide } from '@/components/guide';
import { Ring } from '@/components/ring';
import { Button, Screen, Text, tap } from '@/components/ui';
import { guidePhase } from '@/domain/guide';
import { MOVE_MS, moveCue, type MoveCue } from '@/domain/activities';
import { formatClock } from '@/domain/time';
import { useNow } from '@/hooks/use-now';
import { useT } from '@/i18n';
import { space, usePalette } from '@/theme';

/** Move it: 5 minutes of brisk walking, one cue a minute. The strongest acute craving evidence. */
export default function Move() {
  const t = useT();
  const p = usePalette();
  const now = useNow();
  const [startedAt, setStartedAt] = useState<number>();
  // "Done" ends the walk early and goes straight to the rating.
  const [ended, setEnded] = useState(false);
  const elapsed = startedAt === undefined ? 0 : now - startedAt;
  const done = startedAt !== undefined && (ended || elapsed >= MOVE_MS);
  const cue = moveCue(elapsed);

  // A light vibration at each new cue (the phone may be in a pocket), a stronger one at the end.
  const lastCue = useRef<MoveCue | undefined>(undefined);
  useEffect(() => {
    if (startedAt === undefined || done) return;
    if (lastCue.current && lastCue.current !== cue) tap(Haptics.ImpactFeedbackStyle.Medium);
    lastCue.current = cue;
  }, [cue, startedAt, done]);
  useEffect(() => {
    if (done) tap(Haptics.ImpactFeedbackStyle.Heavy);
  }, [done]);

  return (
    <Screen edges={['bottom']} footer={
        <>
          <Guide tool="move" phase={guidePhase({ started: startedAt !== undefined, elapsed, total: MOVE_MS, done, ended })} />
          {startedAt !== undefined && !done ? <Button kind="secondary" label={t.common.done} onPress={() => setEnded(true)} /> : null}
        </>
      }>
      <CravingCheck tool="move" done={done}>
        {startedAt === undefined ? (
          <>
            <Text>{t.move.intro}</Text>
            <Button big label={t.move.start} onPress={() => setStartedAt(Date.now())} />
            <Text variant="small" tone="soft">
              {t.move.note}
            </Text>
          </>
        ) : (
          <View style={styles.center}>
            <Ring progress={Math.min(1, elapsed / MOVE_MS)} size={220} color={p.lung}>
              <Text
                variant="display"
                style={styles.centerText}
                aria-hidden={done}
                accessibilityLabel={done ? undefined : t.move.left(formatClock(MOVE_MS - elapsed))}>
                {done ? '✓' : formatClock(MOVE_MS - elapsed)}
              </Text>
            </Ring>
            <Text variant="heading" style={styles.centerText} accessibilityLiveRegion="polite">
              {done ? (ended ? t.common.done : t.move.done) : t.move.cues[cue]}
            </Text>
          </View>
        )}
      </CravingCheck>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: space.md, paddingVertical: space.md },
  centerText: { textAlign: 'center' },
});
