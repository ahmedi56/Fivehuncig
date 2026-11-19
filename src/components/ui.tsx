import * as Haptics from 'expo-haptics';
import type { ReactNode, Ref } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
  type TextInputProps,
  type TextProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useIsRTL, useT } from '@/i18n';
import { useAppStore } from '@/store/app-store';
import { contentDirection } from '@/utils/text';
import { emoji, MAX_WIDTH, radius, space, state, type, usePalette, type Palette, type TypeVariant } from '@/theme';

import { Icon, type IconName } from './icons';

export function tap(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  if (Platform.OS !== 'web' && !useAppStore.getState().hapticsOff) Haptics.impactAsync(style).catch(() => undefined);
}

type Tone = 'ink' | 'soft' | 'lung' | 'ember' | 'onLung' | 'sky';

export function Text({
  variant = 'body',
  tone = 'ink',
  followContent,
  style,
  ...rest
}: TextProps & {
  variant?: TypeVariant;
  tone?: Tone;
  /** For text members wrote (posts, replies): align and order it by its own script, not the app's. */
  followContent?: boolean;
  /** React 19 passes `ref` as a prop: lets a screen move focus to a heading. */
  ref?: Ref<RNText>;
}) {
  const p = usePalette();
  const uiRtl = useIsRTL();
  const own = followContent && typeof rest.children === 'string' ? contentDirection(rest.children) : undefined;
  const rtl = own ? own === 'rtl' : uiRtl;
  const color: Record<Tone, string> = {
    ink: p.ink,
    soft: p.inkSoft,
    lung: p.lung,
    ember: p.ember,
    onLung: p.onLung,
    sky: p.sky,
  };
  // Explicit alignment: the app sets layout direction itself (native RTL is off, see app.json),
  // so text must not depend on the platform's own guess. A `textAlign` in `style` still wins.
  return (
    <RNText
      {...rest}
      style={[
        type[variant],
        { color: color[tone], textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' },
        style,
      ]}
    />
  );
}

/** Scrollable page with safe areas and a readable max width. */
export function Screen({
  children,
  scroll = true,
  edges = ['top'],
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: ('top' | 'bottom')[];
  /** Pinned below the scrolling content, so it stays on screen at any text size (e.g. a game's "Done"). */
  footer?: ReactNode;
}) {
  const p = usePalette();
  const rtl = useIsRTL();
  const inner = <View style={styles.inner}>{children}</View>;
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: p.air, direction: rtl ? 'rtl' : 'ltr' }}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        <View style={[styles.scroll, { flex: 1 }]}>{inner}</View>
      )}
      {footer ? (
        <View style={[styles.footer, { borderTopColor: p.line }]}>
          <View style={styles.footerInner}>{footer}</View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// Accessibility states use the aria-* props (selected, checked, disabled, busy): React Native Web
// 0.21 ignores `accessibilityState`, while aria-* works on web, iOS and Android alike.

/** The one pressed look for tappable things without their own (rows, chips, cards, icon buttons). */
export const pressedStyle = { opacity: state.pressedOpacity } as const;

type ButtonKind = 'primary' | 'secondary' | 'quiet' | 'ember';

export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled,
  loading,
  big,
  accessibilityHint,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: ButtonKind;
  disabled?: boolean;
  /** Working (e.g. sending): blocks taps and shows a spinner; the label stays for screen readers. */
  loading?: boolean;
  big?: boolean;
  accessibilityHint?: string;
  style?: ViewStyle;
}) {
  const p = usePalette();
  const bg: Record<ButtonKind, string> = {
    primary: p.lung,
    secondary: p.surface,
    quiet: 'transparent',
    ember: p.emberSoft,
  };
  const fg: Record<ButtonKind, string> = { primary: p.onLung, secondary: p.ink, quiet: p.lung, ember: p.ink };
  const blocked = !!disabled || !!loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      aria-disabled={blocked}
      aria-busy={!!loading}
      disabled={blocked}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        big && styles.buttonBig,
        {
          backgroundColor: bg[kind],
          borderColor: kind === 'secondary' ? p.control : 'transparent',
          // Loading is not "disabled" visually: the spinner already says to wait.
          opacity: disabled ? state.disabledOpacity : pressed ? state.pressedOpacity : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg[kind]} />
      ) : (
        <RNText style={[big ? type.heading : type.bodyStrong, { color: fg[kind], textAlign: 'center' }]}>{label}</RNText>
      )}
    </Pressable>
  );
}

/** A tappable row used in lists (settings, tools). */
export function Row({
  title,
  subtitle,
  icon,
  onPress,
  right,
  style,
  accessibilityLabel,
  accessibilityHint,
}: {
  title: string;
  subtitle?: string;
  /** Replaces the spoken "title. subtitle", e.g. to add a state shown only by an icon. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Layout overrides (margins, flex), merged last. */
  style?: StyleProp<ViewStyle>;
  /** Drawn from the app's icon set, in the theme green. Decorative: the title names the row. */
  icon?: IconName;
  onPress?: () => void;
  right?: ReactNode;
}) {
  const p = usePalette();
  const content = (
    <>
      {icon ? (
        <View style={styles.rowIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Icon name={icon} color={p.lung} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{title}</Text>
        {subtitle ? <Text variant="small" tone="soft">{subtitle}</Text> : null}
      </View>
      {right}
    </>
  );
  if (!onPress) return <View style={[styles.row, { borderColor: p.line }, style]}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}. ${subtitle}` : title)}
      accessibilityHint={accessibilityHint}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.row, { borderColor: p.line }, pressed && pressedStyle, style]}>
      {content}
    </Pressable>
  );
}

export function Panel({ children, tone = 'surface', style }: { children: ReactNode; tone?: 'surface' | 'lung' | 'sky' | 'ember'; style?: ViewStyle }) {
  const p = usePalette();
  const bg = { surface: p.surface, lung: p.lungSoft, sky: p.skySoft, ember: p.emberSoft }[tone];
  return <View style={[styles.panel, { backgroundColor: bg }, style]}>{children}</View>;
}

export function Field({
  label,
  error,
  hint,
  style,
  ...input
}: TextInputProps & { label: string; error?: string; hint?: string }) {
  const p = usePalette();
  const rtl = useIsRTL();
  return (
    <View style={{ gap: space.xs }}>
      <Text variant="bodyStrong">{label}</Text>
      {hint ? <Text variant="small" tone="soft">{hint}</Text> : null}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={p.inkSoft}
        {...input}
        style={[
          type.body,
          styles.input,
          { color: p.ink, backgroundColor: p.surface, borderColor: error ? p.ember : p.control },
          { textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' },
          style,
        ]}
      />
      {error ? (
        <Text variant="small" tone="ember" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * A small pill choice. `role` says what screen readers announce: a plain toggle `button`, one
 * `radio` option inside a radiogroup (pick one), or a `tab` inside a tablist (filters).
 */
export function Chip({
  label,
  selected,
  onPress,
  role = 'button',
  style,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  role?: 'button' | 'radio' | 'tab';
  /** Layout overrides (margins, flex), merged last. */
  style?: StyleProp<ViewStyle>;
}) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole={role}
      aria-checked={role === 'radio' ? !!selected : undefined}
      aria-selected={role === 'radio' ? undefined : !!selected}
      accessibilityLabel={label}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? p.lung : p.surface, borderColor: selected ? p.lung : p.control },
        pressed && pressedStyle,
        style,
      ]}>
      <RNText style={[type.small, { color: selected ? p.onLung : p.ink }]}>{label}</RNText>
    </Pressable>
  );
}

/** An emoji used as a picture at the top of a screen (not as an icon). Decorative: the title says it. */
export function Illustration({ children }: { children: string }) {
  return (
    <RNText style={emoji.lg} accessibilityElementsHidden importantForAccessibility="no">
      {children}
    </RNText>
  );
}

export function Loading() {
  const p = usePalette();
  const t = useT();
  return (
    // Web: transparent, so the page background from global.css shows. The first screen is rendered
    // on the server, which cannot know the colour scheme; CSS can, so dark mode has no light flash.
    <View style={[styles.center, { backgroundColor: Platform.OS === 'web' ? 'transparent' : p.air }]} accessibilityLabel={t.common.loading}>
      <ActivityIndicator color={p.lung} />
    </View>
  );
}

export function Gap({ size = 'md' }: { size?: keyof typeof space }) {
  return <View style={{ height: space[size] }} />;
}

export function paletteStyles(p: Palette) {
  return { divider: { height: StyleSheet.hairlineWidth, backgroundColor: p.line } };
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: space.md, paddingTop: space.md, paddingBottom: space.xxl },
  inner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', gap: space.md },
  footer: { paddingHorizontal: space.md, paddingVertical: space.sm, borderTopWidth: StyleSheet.hairlineWidth },
  footerInner: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', gap: space.sm },
  button: {
    minHeight: 48,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm2,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonBig: { minHeight: 64 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  rowIcon: { width: 32, alignItems: 'center' },
  panel: { borderRadius: radius.md, padding: space.md, gap: space.sm },
  input: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: space.sm2, minHeight: 48 },
  // 44×44 minimum touch target (chips are tapped mid-craving: the 0–10 scale, triggers).
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.sm, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
