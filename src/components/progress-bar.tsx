import { View, type AccessibilityValue } from 'react-native';

import { radius, space, usePalette } from '@/theme';

/**
 * A thin horizontal progress bar. Fills from the reading start (right in Arabic).
 *
 * Decorative by default, for bars whose number is already written next to them. Pass
 * `accessibilityLabel` (and `accessibilityValue`) when the bar itself should be announced.
 */
export function ProgressBar({
  progress,
  tone = 'lung',
  accessibilityLabel,
  accessibilityValue,
}: {
  /** 0..1; values outside are clamped. */
  progress: number;
  tone?: 'lung' | 'sky' | 'ember';
  accessibilityLabel?: string;
  accessibilityValue?: AccessibilityValue;
}) {
  const p = usePalette();
  const fill = Math.min(1, Math.max(0, progress));
  const announced = accessibilityLabel !== undefined;
  return (
    <View
      style={{ height: space.sm, borderRadius: radius.xs, overflow: 'hidden', backgroundColor: p.surfaceAlt }}
      accessible={announced}
      accessibilityRole={announced ? 'progressbar' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={accessibilityValue}
      accessibilityElementsHidden={!announced}
      importantForAccessibility={announced ? 'yes' : 'no-hide-descendants'}>
      <View style={{ width: `${fill * 100}%`, height: '100%', borderRadius: radius.xs, backgroundColor: p[tone] }} />
    </View>
  );
}
