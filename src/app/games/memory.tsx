import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FEATURES } from '@/config/features';
import { CravingCheck } from '@/components/craving-check';
import { Guide } from '@/components/guide';
import { Button, Screen, Text, tap } from '@/components/ui';
import { guidePhase } from '@/domain/guide';
import { MEMORY_MS, memoryPairs } from '@/domain/activities';
import { formatClock } from '@/domain/time';
import { useNow } from '@/hooks/use-now';
import { useT } from '@/i18n';
import { emoji, radius, space, usePalette } from '@/theme';

const FACES = ['🍎', '🌿', '🌊', '⚽', '🎵', '🐢', '🌙', '☀️', '🌻', '🍋'];

function shuffle<T>(list: T[]): T[] {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A board with `pairs` pairs: 6, then 8, then 10 as boards are solved, so it stays demanding. */
const newDeck = (pairs: number) => {
  const faces = shuffle(FACES).slice(0, pairs);
  return shuffle([...faces, ...faces]);
};

function MemoryScreen() {
  const p = usePalette();
  const t = useT();
  const now = useNow();
  const [startedAt] = useState(() => Date.now());
  const [wins, setWins] = useState(0);
  const [deck, setDeck] = useState(() => newDeck(memoryPairs(0)));
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  // "Done" ends the game early and goes straight to the rating.
  const [ended, setEnded] = useState(false);
  const won = matched.size === deck.length;
  // Three minutes at most: enough to ride out a craving, short enough to stop.
  const timeUp = ended || now - startedAt >= MEMORY_MS;

  useEffect(() => {
    if (open.length !== 2) return;
    const [a, b] = open;
    const id = setTimeout(
      () => {
        if (deck[a] === deck[b]) setMatched((m) => new Set([...m, a, b]));
        setOpen([]);
      },
      deck[a] === deck[b] ? 250 : 800,
    );
    return () => clearTimeout(id);
  }, [open, deck]);

  const flip = (i: number) => {
    if (timeUp || open.length === 2 || open.includes(i) || matched.has(i)) return;
    tap();
    if (open.length === 1) setMoves((m) => m + 1);
    setOpen([...open, i]);
  };

  const restart = () => {
    setWins(wins + 1);
    setDeck(newDeck(memoryPairs(wins + 1)));
    setOpen([]);
    setMatched(new Set());
    setMoves(0);
  };

  return (
    <Screen edges={['bottom']} footer={
        <>
          <Guide tool="memory" phase={guidePhase({ started: true, elapsed: now - startedAt, total: MEMORY_MS, done: won || timeUp, ended })} />
          {!timeUp && !won ? <Button kind="secondary" label={t.common.done} onPress={() => setEnded(true)} /> : null}
        </>
      }>
      <CravingCheck tool="memory" done={won || timeUp}>
        <View style={styles.header}>
          <Text variant="stat" accessibilityLiveRegion="polite">
            {won ? t.memory.solved(moves) : t.memory.moves(moves)}
          </Text>
          <Text tone="soft">
            {t.memory.level(deck.length / 2)} · {ended ? t.common.done : timeUp ? t.memory.timeUp : t.memory.left(formatClock(MEMORY_MS - (now - startedAt)))}
          </Text>
        </View>
        <View style={styles.grid}>
          {deck.map((face, i) => {
            const visible = open.includes(i) || matched.has(i);
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={visible ? face : t.memory.hidden(i + 1)}
                onPress={() => flip(i)}
                style={[styles.card, { backgroundColor: visible ? p.surface : p.lung, borderColor: matched.has(i) ? p.lung : p.line }]}>
                <Text style={emoji.md}>{visible ? face : ''}</Text>
              </Pressable>
            );
          })}
        </View>
        {timeUp ? null : won ? <Button label={t.memory.playAgain} onPress={restart} /> : <Text tone="soft">{t.memory.hint}</Text>}
      </CravingCheck>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
  card: { width: '22%', aspectRatio: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
});

/** Hidden for the test release (see src/config/features.ts): back to Today. */
export default function Memory() {
  return FEATURES.extras ? <MemoryScreen /> : <Redirect href="/" />;
}
