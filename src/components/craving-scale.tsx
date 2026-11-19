import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { space } from '@/theme';

import { Chip, Text } from './ui';

/** 0..10 craving strength scale with the meaning of both ends written out. */
export function CravingScale({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  const t = useT();
  return (
    <View style={{ gap: space.xs }}>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
          <Chip role="radio" key={n} label={String(n)} selected={value === n} onPress={() => onChange(n)} />
        ))}
      </View>
      <View style={styles.ends}>
        <Text variant="small" tone="soft">
          0 = {t.surf.scaleLow}
        </Text>
        <Text variant="small" tone="soft">
          10 = {t.surf.scaleHigh}
        </Text>
      </View>
      {value !== undefined ? (
        <Text variant="small" accessibilityLiveRegion="polite">
          {t.surf.scale(value)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  ends: { flexDirection: 'row', justifyContent: 'space-between' },
});
