import '@/global.css';

import { Platform, useColorScheme } from 'react-native';

/**
 * "Fresh air" palette. Green = lungs recovering, sky = breath, amber = a gentle "early" signal.
 * There is deliberately no red: nothing in the app is meant to shame the user.
 */
const light = {
  air: '#EEF3F1',
  surface: '#FFFFFF',
  surfaceAlt: '#E1EBE7',
  ink: '#14262A',
  inkSoft: '#4E6468',
  // Darkest-needed shades for WCAG AA text (4.5:1) on air, surface and lungSoft.
  lung: '#296E60',
  lungSoft: '#CFE5DE',
  onLung: '#FFFFFF',
  // 3:1 against air/surfaceAlt: it draws the keyboard focus ring and progress rings.
  sky: '#538CA9',
  skySoft: '#D6E9F3',
  // Used for error text: 4.5:1 on air, surface and skySoft.
  ember: '#8D5D11',
  emberSoft: '#F6E6C8',
  line: '#C9D7D2',
  // Borders that identify a control (fields, chips, secondary buttons): 3:1 (WCAG 1.4.11).
  // `line` stays for decorative dividers and card edges.
  control: '#858E8B',
};

const dark: typeof light = {
  air: '#0F1A1C',
  surface: '#17262A',
  surfaceAlt: '#203337',
  ink: '#E7F0EE',
  inkSoft: '#9DB3B4',
  lung: '#5CC2A8',
  lungSoft: '#1F4740',
  onLung: '#06231D',
  sky: '#86C1DE',
  skySoft: '#1D3A47',
  ember: '#E9B45A',
  emberSoft: '#4A3818',
  line: '#2B4246',
  control: '#5F7073',
};

export type Palette = typeof light;

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

/** 4-point grid, plus `xxs` (title/subtitle stacks) and `sm2` (control padding), which kept recurring. */
export const space = { xxs: 2, xs: 4, sm: 8, sm2: 12, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
/** `xs` for thin bars and tracks; `pill` for capsules and circles. */
export const radius = { xs: 4, sm: 10, md: 18, pill: 999 } as const;

/** Feedback for every tappable thing: one pressed look, one disabled look. */
export const state = { pressedOpacity: 0.7, disabledOpacity: 0.45 } as const;

/** One raised level, as a cross-platform boxShadow (legacy shadow/elevation props are Android- or iOS-only). */
export const shadows = { raised: '0px 4px 12px rgba(0, 0, 0, 0.18)' } as const;

export const fonts = Platform.select({
  ios: { display: 'ui-rounded', body: 'system-ui' },
  web: { display: 'var(--font-rounded)', body: 'var(--font-display)' },
  default: { display: 'sans-serif-medium', body: 'sans-serif' },
})!;

/** Type scale (roughly 1.25 ratio). */
export const type = {
  hero: { fontSize: 64, lineHeight: 68, fontWeight: '700' as const, fontFamily: fonts.display, fontVariant: ['tabular-nums' as const] },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const, fontFamily: fonts.display },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600' as const, fontFamily: fonts.display },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const, fontFamily: fonts.body },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const, fontFamily: fonts.body },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, fontFamily: fonts.body },
  stat: { fontSize: 24, lineHeight: 28, fontWeight: '700' as const, fontFamily: fonts.display, fontVariant: ['tabular-nums' as const] },
  /** Big numbers inside rings (timers, durations), where `hero` is too large. */
  display: { fontSize: 44, lineHeight: 50, fontWeight: '700' as const, fontFamily: fonts.display, fontVariant: ['tabular-nums' as const] },
  /** Compact labels: tab bar, badges, secondary lines in pills. */
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, fontFamily: fonts.body },
};

/** Emoji used as pictures (screen illustrations, memory cards), not as icons. */
export const emoji = {
  lg: { fontSize: 56, lineHeight: 67 },
  md: { fontSize: 32, lineHeight: 40 },
} as const;

export type TypeVariant = keyof typeof type;

export const MAX_WIDTH = 560;
