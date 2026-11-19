import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FEATURES } from '@/config/features';
import { CravingCheck } from '@/components/craving-check';
import { Guide } from '@/components/guide';
import { Ring } from '@/components/ring';
import { Button, Chip, Screen, Text } from '@/components/ui';
import { guidePhase } from '@/domain/guide';
import { IMAGERY_MS, IMAGERY_PROMPTS, IMAGERY_SCENES, imageryPrompt, type ImageryScene } from '@/domain/activities';
import { useNow } from '@/hooks/use-now';
import { useT } from '@/i18n';
import { space, usePalette } from '@/theme';

/** Vivid Escape: 2 minutes picturing a place in detail, prompted sense by sense. Text only, no audio. */
function ImageryScreen() {
  const t = useT();
  const p = usePalette();
  const now = useNow(500);
  const [scene, setScene] = useState<ImageryScene>('beach');
  const [startedAt, setStartedAt] = useState<number>();
  // "Done" ends the exercise early and goes straight to the rating.
  const [ended, setEnded] = useState(false);
  const elapsed = startedAt === undefined ? 0 : now - startedAt;
  const current = imageryPrompt(elapsed);
  const done = startedAt !== undefined && (ended || current.done);

  return (
    <Screen edges={['bottom']} footer={
        <>
          <Guide tool="imagery" phase={guidePhase({ started: startedAt !== undefined, elapsed, total: IMAGERY_MS, done, ended })} />
          {startedAt !== undefined && !done ? <Button kind="secondary" label={t.common.done} onPress={() => setEnded(true)} /> : null}
        </>
      }>
      <CravingCheck tool="imagery" done={done}>
        {startedAt === undefined ? (
          <>
            <Text>{t.imagery.intro}</Text>
            <Text variant="bodyStrong">{t.imagery.pick}</Text>
            <View style={styles.chips} accessibilityRole="radiogroup">
              {IMAGERY_SCENES.map((s) => (
                <Chip role="radio" key={s} label={t.imagery.scenes[s]} selected={scene === s} onPress={() => setScene(s)} />
              ))}
            </View>
            <Button big label={t.imagery.start} onPress={() => setStartedAt(Date.now())} />
          </>
        ) : (
          <View style={styles.center}>
            <Ring progress={Math.min(1, elapsed / IMAGERY_MS)} size={160} color={p.sky}>
              <Text variant="small" tone="soft" style={styles.centerText}>
                {t.imagery.scenes[scene]}
              </Text>
              <Text variant="stat" style={styles.centerText}>
                {done ? '✓' : t.imagery.step(current.index + 1, IMAGERY_PROMPTS.length)}
              </Text>
            </Ring>
            <Text variant="title" style={styles.centerText} accessibilityLiveRegion="polite">
              {done ? (ended ? t.common.done : t.imagery.done) : t.imagery.prompts[current.prompt]}
            </Text>
          </View>
        )}
      </CravingCheck>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  center: { alignItems: 'center', gap: space.lg, paddingVertical: space.md },
  centerText: { textAlign: 'center' },
});

/** Hidden for the test release (see src/config/features.ts): back to Today. */
export default function Imagery() {
  return FEATURES.extras ? <ImageryScreen /> : <Redirect href="/" />;
}
