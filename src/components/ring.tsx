import type { ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { space, usePalette } from '@/theme';

/** Progress ring. `progress` 0..1. Never wider than the screen (narrow phones, 200% zoom). */
export function Ring({
  progress,
  size: wanted = 260,
  stroke = 14,
  color,
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}) {
  const p = usePalette();
  const size = Math.min(wanted, useWindowDimensions().width - 2 * space.md);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={p.surfaceAlt} strokeWidth={stroke} fill="none" />
        {clamped > 0.005 ? (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? p.lung}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}
