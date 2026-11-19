import { Redirect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { FEATURES } from '@/config/features';
import { CravingCheck } from '@/components/craving-check';
import { Guide } from '@/components/guide';
import { Icon, type IconName } from '@/components/icons';
import { Button, pressedStyle, Screen, Text, tap } from '@/components/ui';
import { guidePhase } from '@/domain/guide';
import { cellsOf, COLS, drop, dropInterval, hardDrop, move, newGame, rotate, ROWS, SESSION_MS, type Game } from '@/domain/blocks';
import { formatClock } from '@/domain/time';
import { useNow } from '@/hooks/use-now';
import { playEffect } from '@/services/sounds';
import { useT } from '@/i18n';
import { radius, space, usePalette } from '@/theme';

/** Block Drop: a 3-minute block puzzle with a hard stop and a craving check at the end. */
function BlockDropScreen() {
  const t = useT();
  const p = usePalette();
  const now = useNow(250);
  const { width, height } = useWindowDimensions();
  const [game, setGame] = useState<Game>(() => newGame());
  const [startedAt, setStartedAt] = useState<number>();
  // "Done" ends the session early and goes straight to the rating.
  const [ended, setEnded] = useState(false);
  const elapsed = startedAt === undefined ? 0 : now - startedAt;
  const done = startedAt !== undefined && (ended || elapsed >= SESSION_MS);
  const running = startedAt !== undefined && !done;

  // Falls by itself, faster every 30 seconds; stops for good at 3:00.
  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setGame((g) => drop(g).game), dropInterval(Date.now() - startedAt!, game.resets));
    return () => clearTimeout(id);
  }, [running, game, startedAt]);

  // A short vibration when rows clear.
  const lastLines = useRef(0);
  useEffect(() => {
    if (game.lines > lastLines.current) {
      tap(Haptics.ImpactFeedbackStyle.Medium);
      playEffect('chime');
    }
    lastLines.current = game.lines;
  }, [game.lines]);
  // A soft knock each time a piece lands: a new piece then appears at the top.
  const lastPiece = useRef(game.piece);
  useEffect(() => {
    if (lastPiece.current !== game.piece && game.piece.y === 0 && lastPiece.current.y > 0) playEffect('land');
    lastPiece.current = game.piece;
  }, [game.piece]);

  const act = (fn: (g: Game) => Game) => running && setGame(fn);
  const controls: { icon: IconName; label: string; run: (g: Game) => Game }[] = [
    { icon: 'left', label: t.blocks.moveLeft, run: (g) => move(g, -1) },
    { icon: 'restart', label: t.blocks.turn, run: rotate },
    { icon: 'right', label: t.blocks.moveRight, run: (g) => move(g, 1) },
    { icon: 'down', label: t.blocks.drop, run: (g) => hardDrop(g).game },
  ];

  // Arrow keys and space on a keyboard (web, or a phone with one attached).
  useEffect(() => {
    if (Platform.OS !== 'web' || !running) return;
    const keys: Record<string, (g: Game) => Game> = {
      ArrowLeft: (g) => move(g, -1),
      ArrowRight: (g) => move(g, 1),
      ArrowUp: rotate,
      ArrowDown: (g) => drop(g).game,
      ' ': (g) => hardDrop(g).game,
    };
    const onKey = (e: KeyboardEvent) => {
      const fn = keys[e.key];
      if (!fn) return;
      e.preventDefault();
      setGame(fn);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running]);

  // The board fills the width on small phones without pushing the controls off a short screen.
  const cell = Math.max(12, Math.floor(Math.min((Math.min(width, 480) - 2 * space.md) / COLS, (height * 0.5) / ROWS)));
  const piece = new Set(cellsOf(game.piece).map(([x, y]) => y * COLS + x));
  const colours = [p.lung, p.sky, p.ember, p.lung, p.sky, p.ember, p.inkSoft];

  return (
    <Screen edges={['bottom']} footer={
        <>
          <Guide tool="blocks" phase={guidePhase({ started: startedAt !== undefined, elapsed, total: SESSION_MS, done, ended })} />
          {running ? <Button kind="secondary" label={t.common.done} onPress={() => setEnded(true)} /> : null}
        </>
      }>
      <CravingCheck tool="blocks" done={done}>
        {startedAt === undefined ? (
          <>
            <Text>{t.blocks.intro}</Text>
            <Button big label={t.blocks.start} onPress={() => setStartedAt(Date.now())} />
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Text variant="bodyStrong" accessibilityLiveRegion="polite">
                {t.blocks.lines(game.lines)}
              </Text>
              <Text tone="soft">{done ? (ended ? t.common.done : t.blocks.done) : t.blocks.left(formatClock(SESSION_MS - elapsed))}</Text>
            </View>
            {game.resets > 0 && !done ? (
              <Text variant="small" tone="soft">
                {t.blocks.fresh}
              </Text>
            ) : null}
            {/* A game board keeps physical left and right in every language. */}
            <Pressable
              onPress={() => act(rotate)}
              accessibilityRole="button"
              accessibilityLabel={t.blocks.turn}
              style={[styles.board, { width: cell * COLS + 4, borderColor: p.line, backgroundColor: p.surfaceAlt, direction: 'ltr' }]}>
              {game.board.map((row, y) => (
                <View key={y} style={styles.row}>
                  {row.map((c, x) => {
                    // The falling piece in ink, landed blocks in their colour.
                    const colour = piece.has(y * COLS + x) ? p.ink : c ? colours[c - 1] : undefined;
                    return (
                      <View key={x} style={{ width: cell, height: cell, padding: 1 }}>
                        {colour ? <View style={[styles.block, { backgroundColor: colour }]} /> : null}
                      </View>
                    );
                  })}
                </View>
              ))}
            </Pressable>
            {done ? null : (
              <View style={[styles.controls, { direction: 'ltr' }]}>
                {controls.map((c) => (
                  <Pressable
                    key={c.icon}
                    accessibilityRole="button"
                    accessibilityLabel={c.label}
                    onPress={() => act(c.run)}
                    style={({ pressed }) => [styles.control, { backgroundColor: p.surface, borderColor: p.control }, pressed && pressedStyle]}>
                    <Icon name={c.icon} color={p.lung} size={28} />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </CravingCheck>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: space.sm },
  board: { alignSelf: 'center', borderWidth: 2, borderRadius: radius.xs, padding: 0 },
  row: { flexDirection: 'row' },
  block: { flex: 1, borderRadius: 2 },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: space.sm },
  control: { flex: 1, maxWidth: 88, minHeight: 56, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

/** Hidden for the test release (see src/config/features.ts): back to Today. */
export default function BlockDrop() {
  return FEATURES.extras ? <BlockDropScreen /> : <Redirect href="/" />;
}
