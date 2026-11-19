import { pressedStyle } from './ui';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { FEATURES } from '@/config/features';
import { useIsRTL, useT } from '@/i18n';
import { Icon, type IconName } from '@/components/icons';
import { MAX_WIDTH, radius, space, type, usePalette } from '@/theme';

/** Web fallback: a simple bottom tab bar (NativeTabs is native-only). */
export default function AppTabs() {
  const p = usePalette();
  const t = useT();
  const rtl = useIsRTL();
  return (
    <Tabs style={{ flex: 1, direction: rtl ? 'rtl' : 'ltr' }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList style={[styles.bar, { backgroundColor: p.surface, borderTopColor: p.line }]}>
        <TabTrigger name="index" href="/" asChild>
          <TabButton icon="today">{t.tabs.today}</TabButton>
        </TabTrigger>
        <TabTrigger name="sos" href="/sos" asChild>
          <TabButton icon="sos">{t.tabs.sos}</TabButton>
        </TabTrigger>
        {FEATURES.community ? (
          <TabTrigger name="community" href="/community" asChild>
            <TabButton icon="community">{t.tabs.community}</TabButton>
          </TabTrigger>
        ) : null}
        <TabTrigger name="progress" href="/progress" asChild>
          <TabButton icon="progress">{t.tabs.progress}</TabButton>
        </TabTrigger>
        {FEATURES.learn ? (
          <TabTrigger name="learn" href="/learn" asChild>
            <TabButton icon="learn">{t.tabs.learn}</TabButton>
          </TabTrigger>
        ) : null}
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, icon, ...props }: TabTriggerSlotProps & { icon: IconName }) {
  const p = usePalette();
  // At 200% browser zoom a 375 px phone is 188 px wide: five labels no longer fit, even cut short.
  // The bar then shows icons only, in slimmer pills; each tab keeps its full name for screen readers.
  const narrow = useWindowDimensions().width < 280;
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      aria-selected={!!isFocused}
      style={({ pressed }) => [styles.tab, pressed && pressedStyle]}>
      {/* Decorative: the label names the tab ("Community", not "handshake Community"). */}
      <View style={[styles.pill, narrow && styles.pillNarrow, { backgroundColor: isFocused ? p.lungSoft : 'transparent' }]} aria-hidden>
        <Icon name={icon} color={isFocused ? p.lung : p.inkSoft} />
      </View>
      {narrow ? null : (
        <Text numberOfLines={1} style={[type.caption, styles.label, { color: isFocused ? p.lung : p.inkSoft }]}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: space.sm,
    width: '100%',
    maxWidth: MAX_WIDTH + 2 * space.md,
    alignSelf: 'center',
  },
  // Five tabs must fit a 320 px phone. Each tab starts from its own width (flexBasis auto) and
  // shares the spare room, so a long label ("Communauté") borrows from short ones ("SOS") instead of
  // being cut to an equal fifth. Labels still truncate rather than overflow at large text sizes.
  // No bold for the active label; the active tab is marked by its pill and colour instead.
  tab: { alignItems: 'center', gap: 2, flexGrow: 1, flexShrink: 1, flexBasis: 'auto', minWidth: 0, minHeight: 48 },
  pill: { paddingHorizontal: space.md, paddingVertical: space.xxs, borderRadius: radius.pill },
  pillNarrow: { paddingHorizontal: space.xs },
  // Slightly smaller than body-small so five labels (e.g. "Community", "Communauté") fit at 320–375 px.
  label: { textAlign: 'center' },
});
