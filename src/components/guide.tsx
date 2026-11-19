import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { guideLine, type GuidePhase } from '@/domain/guide';
import type { RatedTool } from '@/domain/ratings';
import { useT } from '@/i18n';
import { useAppStore } from '@/store/app-store';
import { radius, space, usePalette } from '@/theme';
import { isolate } from '@/utils/text';

import { Text } from './ui';

/**
 * Mahla, the guide: a small breath-cloud companion pinned under every SOS tool, with one short line for
 * where the member is (before, during, after). It doesn't move, so reduced motion needs nothing;
 * the line is announced politely when it changes.
 */
export function Guide({ tool, phase }: { tool: RatedTool; phase: GuidePhase }) {
  const t = useT();
  const p = usePalette();
  const ratings = useAppStore((s) => s.ratings);
  const reasons = useAppStore((s) => s.reasons);
  // Chosen once per visit, so the words stay put while the timer ticks.
  const [seed] = useState(() => Math.floor(Date.now() / 1000));
  const line = guideLine(phase, { tool, ratings, reasons: reasons.length, seed });
  const text =
    line.kind === 'endedEarly'
      ? t.guide.endedEarly
      : line.kind === 'best'
        ? t.guide.best
        : line.kind === 'reason'
          ? t.guide.reason(isolate(reasons[line.pick % reasons.length].text))
          : t.guide[line.kind][line.pick % t.guide[line.kind].length];
  const happy = phase === 'after' || phase === 'endedEarly';
  return (
    <View style={styles.row} accessibilityLabel={`${t.guide.name}: ${text}`} accessible>
      <Buddy happy={happy} />
      <View style={[styles.bubble, { backgroundColor: p.surface, borderColor: p.line }]}>
        <Text variant="small" tone="lung">
          {t.guide.name}
        </Text>
        <Text accessibilityLiveRegion="polite">{text}</Text>
      </View>
    </View>
  );
}

/** Original art: a soft cloud of breath with a face. Calm while working, smiling once done. */
function Buddy({ happy }: { happy: boolean }) {
  const p = usePalette();
  const face = { stroke: p.ink, strokeWidth: 2, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48" aria-hidden>
      <Path
        d="M14 39c-6 0-10-4-10-9.5S8 20 13.5 20c1-7 5.5-12 11-12S35 12.5 36 19.5c5 .2 8.5 4.3 8.5 9.8S40.5 39 35 39z"
        fill={p.lungSoft}
        stroke={p.lung}
        strokeWidth={2}
      />
      {happy ? (
        <>
          <Path d="M17.5 27q2.5-3 5 0" {...face} />
          <Path d="M27.5 27q2.5-3 5 0" {...face} />
          <Path d="M20.5 31q4.5 4.5 9 0" {...face} />
        </>
      ) : (
        <>
          <Circle cx={20} cy={26.5} r={1.9} fill={p.ink} />
          <Circle cx={30} cy={26.5} r={1.9} fill={p.ink} />
          <Path d="M22 31.5q3 2 6 0" {...face} />
        </>
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  bubble: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.sm2, paddingVertical: space.sm },
});
