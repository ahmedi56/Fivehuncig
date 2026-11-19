import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  CHALLENGES,
  challengeStatus,
  LEVELS,
  personalRank,
  POINTS,
  suggestEasier,
  unlockedLevels,
  weekKey,
  type JourneyData,
  type WeekScore,
} from '@/domain/journey';
import type { Memory } from '@/domain/memories';
import type { Difficulty } from '@/domain/types';
import { useLang, useT } from '@/i18n';
import { formatShortDate } from '@/utils/date';
import { useAppStore } from '@/store/app-store';
import { emoji, radius, space, state, usePalette } from '@/theme';

import { ProgressBar } from './progress-bar';
import { tap, Button, Panel, Text, pressedStyle } from './ui';

/** Weekly challenge: optional, picked by the member, measured from their own actions. */
export function ChallengeCard({ data, now }: { data: JourneyData; now: number }) {
  const t = useT();
  const p = usePalette();
  const entry = data.challenges.find((c) => c.week === weekKey(now));
  const status = entry ? challengeStatus(data, entry) : undefined;
  const unlocked = unlockedLevels(data);
  const [level, setLevel] = useState<Difficulty>(unlocked[unlocked.length - 1]);
  const easier = suggestEasier(data, now);

  if (status) {
    const { def, progress, done } = status;
    return (
      <Panel tone={done ? 'lung' : 'surface'}>
        <Text variant="small" tone="soft">
          {t.challenge.title} · {t.challenge.levels[def.level]}
        </Text>
        <Text variant="heading">{t.challenge.items[def.id as keyof typeof t.challenge.items]}</Text>
        <ProgressBar
          progress={progress / def.target}
          accessibilityLabel={t.challenge.progress(progress, def.target)}
          accessibilityValue={{ min: 0, max: def.target, now: progress }}
        />
        <Text variant="small">{t.challenge.progress(progress, def.target)}</Text>
        <Text tone="soft" accessibilityLiveRegion="polite">
          {done ? `${t.challenge.done} ${t.challenge.points(POINTS.challenge[def.level])}` : t.challenge.inProgress}
        </Text>
        {!done ? <Button kind="quiet" label={t.challenge.change} onPress={() => useAppStore.getState().leaveChallenge()} /> : null}
      </Panel>
    );
  }

  return (
    <Panel>
      <Text variant="heading">{t.challenge.title}</Text>
      <Text variant="small" tone="soft">
        {t.challenge.optional}
      </Text>
      {easier ? <Text tone="soft">{t.challenge.easier}</Text> : null}
      <View style={styles.levels} accessibilityRole="tablist">
        {LEVELS.map((l) => {
          const open = unlocked.includes(l);
          const selected = level === l;
          return (
            <Pressable
              key={l}
              accessibilityRole="tab"
              aria-selected={selected}
              aria-disabled={!open}
              accessibilityLabel={open ? undefined : `${t.challenge.levels[l]}. ${t.challenge.locked}`}
              accessibilityHint={open ? t.challenge.levelHint[l] : undefined}
              disabled={!open}
              onPress={() => {
                tap();
                setLevel(l);
              }}
              style={({ pressed }) => [
                styles.level,
                { backgroundColor: selected ? p.lung : p.surfaceAlt, opacity: open ? 1 : state.disabledOpacity },
                pressed && pressedStyle,
              ]}>
              <Text variant="small" tone={selected ? 'onLung' : 'ink'} style={{ textAlign: 'center' }}>
                {/* A locked level shows only its lock: name and lock don't fit a quarter of a 320 px phone. */}
                {open ? t.challenge.levels[l] : '🔒'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text variant="small" tone="soft">
        {t.challenge.levelHint[level]}
        {unlocked.length < LEVELS.length ? ` · 🔒 ${t.challenge.locked}` : ''}
      </Text>
      {CHALLENGES.filter((c) => c.level === level).map((c) => (
        <View key={c.id} style={styles.option}>
          <Text style={styles.optionText}>{t.challenge.items[c.id as keyof typeof t.challenge.items]}</Text>
          <Button kind="secondary" label={t.challenge.join} onPress={() => useAppStore.getState().joinChallenge(c.id)} style={styles.optionButton} />
        </View>
      ))}
    </Panel>
  );
}

/** "Your league": this week against the member's own recent weeks. Nothing is shared. */
export function LeaguePanel({ weeks, soFar }: { weeks: WeekScore[]; soFar: WeekScore[] }) {
  const t = useT();
  const lang = useLang();
  const p = usePalette();
  const current = weeks[weeks.length - 1];
  const rank = personalRank(soFar);
  const max = Math.max(1, ...weeks.map((w) => w.points));
  return (
    <Panel>
      <Text variant="heading">{t.journey.leagueTitle}</Text>
      <Text variant="stat">{t.journey.pointsWeek(current?.points ?? 0)}</Text>
      <Text>{rank ? t.journey.leagueRank(rank.rank, rank.of) : t.journey.leagueFirst}</Text>
      <View style={styles.bars}>
        {weeks.map((w, i) => (
          <View key={w.week} style={styles.barSlot} accessible accessibilityLabel={t.journey.weekBar(formatShortDate(new Date(`${w.week}T00:00:00`).getTime(), lang), w.points)}>
            <View
              style={{
                height: Math.max(3, (w.points / max) * 80),
                backgroundColor: i === weeks.length - 1 ? p.lung : p.sky,
                borderRadius: radius.xs,
              }}
            />
          </View>
        ))}
      </View>
      <Text variant="small" tone="soft">
        {t.journey.pointsHow}
      </Text>
      <Text variant="small" tone="soft">
        {t.journey.leagueNote}
      </Text>
    </Panel>
  );
}

/** One collectible memory. Locked hidden memories stay a mystery ("???"). */
export function MemoryCard({ memory }: { memory: Memory }) {
  const t = useT();
  const lang = useLang();
  const p = usePalette();
  const copy = t.memories.items[memory.id];
  const unlocked = memory.unlockedAt !== undefined;
  const mystery = !unlocked && memory.hidden;
  const date = unlocked ? formatShortDate(memory.unlockedAt!, lang, { year: true }) : undefined;
  const label = mystery
    ? `${t.memories.locked}. ${t.memories.lockedHint}`
    : `${copy.title}. ${copy.body}${date ? `. ${date}` : memory.progress ? `. ${t.memories.progress(memory.progress.current, memory.progress.target)}` : ''}`;

  return (
    <View
      style={[styles.memory, { backgroundColor: unlocked ? p.lungSoft : p.surface, borderColor: unlocked ? p.lung : p.line }]}
      accessible
      accessibilityLabel={label}>
      {/* Faded more than a disabled control on purpose: a memory not yet earned, not a button. */}
      <Text style={[emoji.md, { opacity: unlocked ? 1 : 0.35, textAlign: 'center' }]}>{mystery ? '❔' : memory.emoji}</Text>
      <Text variant="bodyStrong" style={{ textAlign: 'center' }}>
        {mystery ? t.memories.locked : copy.title}
      </Text>
      <Text variant="small" tone="soft" style={{ textAlign: 'center' }}>
        {mystery ? t.memories.lockedHint : copy.body}
      </Text>
      {date ? (
        <Text variant="small" tone="lung" style={{ textAlign: 'center' }}>
          {date}
        </Text>
      ) : memory.progress && !mystery ? (
        <View style={{ gap: space.xs, alignSelf: 'stretch' }}>
          <ProgressBar progress={memory.progress.current / memory.progress.target} tone="sky" />
          <Text variant="small" tone="soft" style={{ textAlign: 'center' }}>
            {t.memories.progress(memory.progress.current, memory.progress.target)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  levels: { flexDirection: 'row', gap: space.xs },
  level: { flex: 1, minHeight: 44, borderRadius: radius.sm, justifyContent: 'center', paddingHorizontal: space.xs },
  // Text and button side by side when there's room; on narrow phones the button drops below
  // instead of squeezing the text to a word per line.
  option: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm },
  optionText: { flexGrow: 1, flexShrink: 1, flexBasis: 180 },
  // Never wider than the panel: at 200% zoom the label wraps inside the button instead.
  optionButton: { maxWidth: '100%' },
  bars: { height: 84, flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  barSlot: { flex: 1, justifyContent: 'flex-end' },
  memory: { width: '48%', borderWidth: 1.5, borderRadius: radius.md, padding: space.md, gap: space.sm, alignItems: 'center', minHeight: 170 },
});
