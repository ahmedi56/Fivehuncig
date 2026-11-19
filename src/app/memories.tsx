import { StyleSheet, View } from 'react-native';

import { MemoryCard } from '@/components/journey';
import { Screen, Text } from '@/components/ui';
import { computeMemories } from '@/domain/memories';
import { useJourney } from '@/hooks/use-journey';
import { useNow } from '@/hooks/use-now';
import { useT } from '@/i18n';
import { useAppStore } from '@/store/app-store';
import { space } from '@/theme';

/** All memories as collectible cards: found ones first (newest first), then the ones still to find. */
export default function Memories() {
  const t = useT();
  const now = useNow(60_000);
  const profile = useAppStore((s) => s.profile);
  const journey = useJourney();
  if (!profile || !journey) return null;

  const all = computeMemories(profile, journey, now);
  const found = all.filter((m) => m.unlockedAt !== undefined).sort((a, b) => b.unlockedAt! - a.unlockedAt!);
  const waiting = all.filter((m) => m.unlockedAt === undefined);

  return (
    <Screen edges={['bottom']}>
      <Text tone="soft">{t.memories.found(found.length, all.length)}</Text>
      <View style={styles.grid}>
        {[...found, ...waiting].map((m) => (
          <MemoryCard key={m.id} memory={m} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
