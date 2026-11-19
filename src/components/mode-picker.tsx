import { Pressable, StyleSheet, View } from 'react-native';

import type { Mode } from '@/domain/types';
import { useT } from '@/i18n';
import { radius, space, usePalette } from '@/theme';

import { Icon, type IconName } from './icons';
import { tap, Text, pressedStyle } from './ui';

export const MODES: { mode: Mode; icon: IconName }[] = [
  { mode: 'watch', icon: 'eye' },
  { mode: 'cutdown', icon: 'today' },
  { mode: 'quit', icon: 'sunrise' },
];

export function ModePicker({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  const p = usePalette();
  const t = useT();
  return (
    <View style={{ gap: space.sm }} accessibilityRole="radiogroup">
      {MODES.map((m) => {
        const selected = m.mode === value;
        const copy = t.modes[m.mode];
        return (
          <Pressable
            key={m.mode}
            accessibilityRole="radio"
            aria-checked={selected}
            accessibilityLabel={`${copy.title}. ${copy.body}`}
            onPress={() => {
              tap();
              onChange(m.mode);
            }}
            style={({ pressed }) => [
              styles.option,
              { backgroundColor: selected ? p.lungSoft : p.surface, borderColor: selected ? p.lung : p.control },
              pressed && pressedStyle,
            ]}>
            <Icon name={m.icon} color={p.lung} size={28} />
            <View style={{ flex: 1, gap: space.xxs }}>
              <Text variant="bodyStrong">{copy.title}</Text>
              {m.mode === 'cutdown' ? (
                <Text variant="small" tone="lung">
                  {t.modes.recommended}
                </Text>
              ) : null}
              <Text variant="small" tone="soft">
                {copy.body}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'center',
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 2,
  },
});
