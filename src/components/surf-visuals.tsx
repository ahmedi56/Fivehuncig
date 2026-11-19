import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useIsRTL } from '@/i18n';
import { radius, space, usePalette } from '@/theme';

import { Text } from './ui';

/**
 * Transform animations run on the native UI thread on iOS and Android. React Native Web has no
 * native animated module, so asking for it there only logs a warning and falls back to JS:
 * on web we use the JS driver directly (same easing and timing, same look).
 */
export const NATIVE_DRIVER = Platform.OS !== 'web';

/** True when the member asked the system to reduce motion. Animations then stay still. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

const WAVE_W = 320;
const WAVE_H = 120;

function wavePath(width: number, height: number, amplitude: number, waves: number): string {
  const mid = height / 2;
  let d = `M 0 ${mid}`;
  for (let x = 0; x <= width; x += 4) {
    d += ` L ${x} ${(mid - Math.sin((x / width) * Math.PI * 2 * waves) * amplitude).toFixed(1)}`;
  }
  return `${d} L ${width} ${height} L 0 ${height} Z`;
}

/**
 * A slow, calm wave: one long swell that drifts across, plus a gentle rise and fall.
 * Mirrors its drift in right-to-left languages; holds still with reduced motion.
 */
export function Wave({ label }: { label: string }) {
  const p = usePalette();
  const rtl = useIsRTL();
  const reduce = useReduceMotion();
  const [drift] = useState(() => new Animated.Value(0));
  const [swell] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduce) return;
    const a = Animated.loop(Animated.timing(drift, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER }));
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(swell, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(swell, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
      ]),
    );
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [reduce, drift, swell]);

  const translateX = drift.interpolate({ inputRange: [0, 1], outputRange: rtl ? [-WAVE_W, 0] : [0, -WAVE_W] });
  const translateY = swell.interpolate({ inputRange: [0, 1], outputRange: [14, -14] });

  return (
    <View style={styles.waveBox} accessible accessibilityRole="image" accessibilityLabel={label}>
      {/* One continuous shape, three tiles wide: it drifts by one tile and repeats seamlessly,
          while two tiles (640 px) always cover the box on any phone width. */}
      <Animated.View style={{ width: WAVE_W * 3, transform: [{ translateX }, { translateY }] }}>
        <Svg width={WAVE_W * 3} height={WAVE_H}>
          <Path d={wavePath(WAVE_W * 3, WAVE_H, 26, 3)} fill={p.sky} opacity={0.55} />
          <Path d={wavePath(WAVE_W * 3, WAVE_H, 16, 6)} fill={p.lung} opacity={0.35} />
        </Svg>
      </Animated.View>
    </View>
  );
}

export const BREATH = [
  { key: 'in', seconds: 3, to: 1 },
  { key: 'hold', seconds: 2, to: 1 },
  { key: 'out', seconds: 5, to: 0 },
] as const;

/**
 * Breathing circle (in 3, hold 2, out 5): the circle grows on the in-breath, rests, and slowly
 * shrinks on the out-breath, with the phase name, a seconds countdown and a three-step phase guide.
 * With reduced motion the circle stays still and the words and countdown carry the rhythm.
 */
export function BreathCircle({ labels, secondsLabel }: { labels: Record<'in' | 'hold' | 'out', string>; secondsLabel: (s: number) => string }) {
  const p = usePalette();
  const reduce = useReduceMotion();
  const [scale] = useState(() => new Animated.Value(0));
  // Phase and its countdown change together, from timer callbacks only.
  const [{ phase, left }, setState] = useState({ phase: 0, left: BREATH[0].seconds as number });

  useEffect(() => {
    const current = BREATH[phase];
    const anim = reduce
      ? undefined
      : Animated.timing(scale, {
          toValue: current.to,
          duration: current.seconds * 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVE_DRIVER,
        });
    anim?.start();
    const tick = setInterval(() => setState((s) => ({ ...s, left: Math.max(1, s.left - 1) })), 1000);
    const next = setTimeout(() => {
      const following = (phase + 1) % BREATH.length;
      setState({ phase: following, left: BREATH[following].seconds });
    }, current.seconds * 1000);
    return () => {
      anim?.stop();
      clearInterval(tick);
      clearTimeout(next);
    };
  }, [phase, reduce, scale]);

  const size = reduce ? 0.8 : scale.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const label = labels[BREATH[phase].key];

  return (
    <View style={{ gap: space.sm2 }}>
      <View style={styles.breathStage}>
        <Animated.View style={[styles.breathCircle, { backgroundColor: p.skySoft, borderColor: p.sky, transform: [{ scale: size }] }]} />
        <View style={styles.breathText} accessibilityLiveRegion="polite" accessible accessibilityLabel={`${label}, ${secondsLabel(left)}`}>
          <Text variant="heading" style={{ textAlign: 'center' }}>
            {label}
          </Text>
          <Text variant="stat" tone="lung" style={{ textAlign: 'center' }}>
            {left}
          </Text>
        </View>
      </View>
      {/* Which phase comes next, without reading: in → hold → out. Decorative, the label above says it. */}
      <View style={styles.phases} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {BREATH.map((b, i) => (
          <View key={b.key} style={[styles.phase, { backgroundColor: i === phase ? p.lungSoft : 'transparent', borderColor: i === phase ? p.lung : p.line }]}>
            <Text variant="small" tone={i === phase ? 'lung' : 'soft'} style={{ textAlign: 'center', fontWeight: i === phase ? '600' : '400' }}>
              {labels[b.key]}
            </Text>
            <Text variant="caption" tone="soft" style={{ textAlign: 'center' }}>
              {secondsLabel(b.seconds)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  waveBox: { height: WAVE_H + 40, width: '100%', overflow: 'hidden', justifyContent: 'center', borderRadius: radius.md },
  breathStage: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  breathCircle: { position: 'absolute', width: 220, height: 220, borderRadius: radius.pill, borderWidth: 3 },
  breathText: { alignItems: 'center' },
  phases: { flexDirection: 'row', gap: space.sm },
  phase: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.sm, paddingVertical: space.sm },
});
