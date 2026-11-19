import { Pressable, Text, View } from 'react-native';

import { DATA_MODES, devDataMode, setDevDataMode, type DataMode } from './data-mode';

const LABELS: Record<DataMode, string> = { demo: 'Demo', worst: 'Worst', heavy: 'Heavy', empty: 'Empty', one: 'One' };

/**
 * DEV ONLY (break-ui). Switches the whole app between real data and the worst-case fixtures.
 * Plain chrome on purpose: it is not part of the design under test, and is never translated.
 */
export function DevDataToggle() {
  const current = devDataMode();
  return (
    <View
      // Above the tab bar, centred, out of the content's way.
      style={{ position: 'absolute', bottom: 76, left: 0, right: 0, alignItems: 'center', zIndex: 1000 }}
      pointerEvents="box-none">
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Dev data (break-ui)"
        style={{ flexDirection: 'row', backgroundColor: '#e5e5e5', borderRadius: 999, padding: 3, boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.2)' }}>
        {DATA_MODES.map((mode) => {
          const on = mode === current;
          return (
            <Pressable
              key={mode}
              accessibilityRole="radio"
              aria-checked={on}
              accessibilityLabel={LABELS[mode]}
              onPress={() => (on ? undefined : setDevDataMode(mode))}
              style={{ paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, backgroundColor: on ? '#ffffff' : 'transparent' }}>
              <Text style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: on ? '#111111' : '#555555', fontWeight: on ? '600' : '400' }}>
                {LABELS[mode]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
