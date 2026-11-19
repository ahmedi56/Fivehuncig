import { StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import { FEATURES } from '@/config/features';
import { BestTool } from '@/components/craving-check';
import { ChallengeCard, LeaguePanel, MemoryCard } from '@/components/journey';
import { ProgressBar } from '@/components/progress-bar';
import { Button, Panel, Screen, Text } from '@/components/ui';
import { milestoneProgress } from '@/domain/health';
import {
  bestStreak,
  cigarettesAvoided,
  cravingsBeaten,
  dailyCounts,
  formatMoney,
  moneySaved,
  smokeFreeDays,
  smokeFreeSince,
  topTriggers,
} from '@/domain/stats';
import { cravingTimeInsight, DAY_PARTS } from '@/domain/insights';
import { personalBests, weeklyPoints, weeklyPointsSoFar } from '@/domain/journey';
import { computeMemories } from '@/domain/memories';
import { formatDuration } from '@/domain/time';
import { useJourney } from '@/hooks/use-journey';
import { useNow } from '@/hooks/use-now';
import { formatNumber, useLang, useT } from '@/i18n';
import { useAppStore } from '@/store/app-store';
import { radius, space, usePalette } from '@/theme';
import { formatShortDate } from '@/utils/date';

export default function Progress() {
  const now = useNow(30_000);
  const p = usePalette();
  const t = useT();
  const lang = useLang();
  const profile = useAppStore((s) => s.profile);
  const smokes = useAppStore((s) => s.smokes);
  const cravings = useAppStore((s) => s.cravings);
  const journey = useJourney();
  const router = useRouter();
  if (!profile || !journey) return null;

  const days = dailyCounts(smokes, now, 14);
  const maxBar = Math.max(profile.cigsPerDay, ...days.map((d) => d.count), 1);
  const avoided = cigarettesAvoided(smokes, profile, now);
  const since = now - smokeFreeSince(smokes, profile);
  const memories = computeMemories(profile, journey, now);
  const latest = memories
    .filter((m) => m.unlockedAt !== undefined)
    .sort((a, b) => b.unlockedAt! - a.unlockedAt!)
    .slice(0, 2);
  const bests = personalBests(journey, now);
  const hasData = smokes.length > 0 || cravings.length > 0;
  const triggers = topTriggers(smokes, cravings, now).slice(0, 4);
  const timing = cravingTimeInsight(cravings, smokes, now);
  const maxTrigger = triggers[0]?.count ?? 1;
  const num = (x: number) => formatNumber(x, lang);
  const duration = (ms: number) => formatDuration(ms, t.units, num);
  const beaten = cravingsBeaten(cravings);
  // Without a logged cigarette (or a quit date) there is no "last cigarette" to count from:
  // counting from sign-up would show "0 s" to every new member.
  const hasLast = smokes.length > 0 || profile.quitAt !== undefined;
  const anyBest = bests.bestWeekCravings + bests.surfsCompleted + bests.lessonsRead > 0;

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">
        {t.progress.title}
      </Text>

      <View style={styles.grid}>
        {/* Money saved only grows, so it gets a full-width row. */}
        <Big wide value={formatMoney(moneySaved(avoided, profile), profile.currency, num)} label={t.progress.moneySaved} />
        <Big value={num(avoided)} label={t.progress.notSmoked(avoided)} />
        <Big value={num(beaten)} label={t.progress.cravingsBeaten(beaten)} />
        {hasLast ? <Big value={duration(bestStreak(smokes, profile, now))} label={t.progress.longestBreak} /> : null}
      </View>
      <Text variant="small" tone="soft">
        {t.progress.estimateNote}
      </Text>

      <Panel>
        <Text variant="heading">{t.journey.bestTitle}</Text>
        <BestTool bare />
        {hasLast ? <Text>{t.journey.bestStreak(duration(bestStreak(smokes, profile, now)))}</Text> : null}
        {/* Six lines of 0 tell a new member nothing; one line says how to fill them. */}
        {anyBest ? (
          <>
            <Text>{t.journey.bestWeek(bests.bestWeekCravings)}</Text>
            <Text>{t.journey.surfs(bests.surfsCompleted)}</Text>
            <Text>{t.journey.lessons(bests.lessonsRead)}</Text>
            <Text>{t.journey.activeNow(bests.currentActiveStreak)}</Text>
            <Text>{t.journey.activeBest(bests.bestActiveStreak)}</Text>
          </>
        ) : (
          <Text tone="soft">{t.journey.bestEmpty}</Text>
        )}
      </Panel>

      <View style={{ gap: space.sm }}>
        <Text variant="heading">{t.memories.latest}</Text>
        <Text variant="small" tone="soft">
          {t.memories.found(memories.filter((m) => m.unlockedAt !== undefined).length, memories.length)}
        </Text>
        <View style={styles.memories}>
          {latest.map((m) => (
            <MemoryCard key={m.id} memory={m} />
          ))}
        </View>
        <Button kind="secondary" label={t.memories.seeAll} onPress={() => router.push('/memories')} />
      </View>


      <Panel>
        <Text variant="heading">{t.progress.last14}</Text>
        {hasData ? null : <Text tone="soft">{t.progress.empty}</Text>}
        <View
          style={styles.chart}
          accessible
          accessibilityLabel={t.progress.chartA11y(days.map((d) => d.count).join(', '), profile.cigsPerDay)}>
          <View style={[styles.baseline, { bottom: (profile.cigsPerDay / maxBar) * 120, borderColor: p.ember }]} />
          {days.map((d, i) => (
            <View key={d.key} style={styles.barSlot}>
              <View
                style={{
                  // A day with cigarettes is never thinner than 6 px, so 2 of 100 still shows;
                  // a smoke-free day is a 2 px stub in the line colour.
                  height: d.count ? Math.max(6, (d.count / maxBar) * 120) : 2,
                  backgroundColor: i === days.length - 1 ? p.lung : d.count ? p.sky : p.line,
                  borderRadius: radius.xs,
                }}
              />
            </View>
          ))}
        </View>
        <View style={styles.chartEnds} aria-hidden>
          <Text variant="caption" tone="soft">
            {formatShortDate(new Date(`${days[0].key}T00:00:00`).getTime(), lang, { now })}
          </Text>
          <Text variant="caption" tone="soft">
            {t.progress.chartToday}
          </Text>
        </View>
        <Text variant="small" tone="soft">
          {t.progress.chartLegend(profile.cigsPerDay)}
        </Text>
        <Text variant="small" tone="soft">
          {t.progress.smokeFreeDays(smokeFreeDays(smokes, profile, now))}
        </Text>
      </Panel>

      <Panel>
        <Text variant="heading">{t.insights.title}</Text>
        {timing ? (
          <>
            <Text>
              {t.insights.body(
                timing.total,
                timing.count,
                t.insights.parts[timing.part],
                `${DAY_PARTS[timing.part].from}:00–${DAY_PARTS[timing.part].to}:00`,
              )}
            </Text>
            <Text variant="small" tone="soft">
              {t.insights.tip}
            </Text>
          </>
        ) : (
          <Text tone="soft">{t.insights.notEnough}</Text>
        )}
      </Panel>

      <Panel>
        <Text variant="heading">{t.progress.triggersTitle}</Text>
        <Text variant="small" tone="soft">
          {triggers.length ? t.progress.triggersSubtitle : t.progress.triggersEmpty}
        </Text>
        {triggers.map(({ trigger, count }) => (
          <View
            key={trigger}
            style={styles.trigger}
            accessible
            accessibilityLabel={`${t.triggers[trigger]}: ${t.progress.times(count)}`}>
            <View style={styles.triggerLabel}>
              <Text variant="bodyStrong">{t.triggers[trigger]}</Text>
              <Text variant="small" tone="soft">
                {t.progress.times(count)}
              </Text>
            </View>
            <ProgressBar progress={count / maxTrigger} tone="ember" />
          </View>
        ))}
      </Panel>

      {FEATURES.extras ? <ChallengeCard data={journey} now={now} /> : null}

      {FEATURES.extras ? <LeaguePanel weeks={weeklyPoints(journey, now)} soFar={weeklyPointsSoFar(journey, now)} /> : null}

      <Panel>
        <Text variant="heading">{t.progress.bodyTitle}</Text>
        <Text variant="small" tone="soft">
          {hasLast ? t.progress.bodyIntro(duration(since)) : t.progress.bodyNoLast}
        </Text>
        {(hasLast ? milestoneProgress(since) : []).map((m) => (
          <View
            key={m.id}
            style={styles.milestone}
            accessible
            accessibilityLabel={`${t.milestones[m.id].title}: ${t.milestones[m.id].detail} ${m.reached ? t.progress.reached : t.progress.percent(Math.round(m.progress * 100))}`}>
            <View style={[styles.dot, { backgroundColor: m.reached ? p.lung : p.surfaceAlt }]}>
              <Text variant="small" tone={m.reached ? 'onLung' : 'soft'}>
                {m.reached ? '✓' : ''}
              </Text>
            </View>
            <View style={{ flex: 1, gap: space.xs }}>
              <Text variant="bodyStrong">{t.milestones[m.id].title}</Text>
              <Text variant="small" tone="soft">
                {t.milestones[m.id].detail}
              </Text>
              {!m.reached ? (
                <ProgressBar progress={m.progress} tone="sky" />
              ) : null}
            </View>
          </View>
        ))}
        <Text variant="small" tone="soft">
          {t.progress.bodyNote}
        </Text>
      </Panel>

    </Screen>
  );
}

function Big({ value, label, wide }: { value: string; label: string; wide?: boolean }) {
  const p = usePalette();
  return (
    <View style={[styles.big, wide && styles.wide, { backgroundColor: p.surface }]} accessible accessibilityLabel={`${value} ${label}`}>
      <Text variant="stat">
        {value}
      </Text>
      <Text variant="small" tone="soft">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  big: { flexBasis: '48%', flexGrow: 1, padding: space.md, borderRadius: radius.md, gap: space.xxs },
  wide: { flexBasis: '100%' },
  chart: { height: 124, flexDirection: 'row', alignItems: 'flex-end', gap: space.xs, marginTop: space.sm },
  barSlot: { flex: 1, justifyContent: 'flex-end' },
  chartEnds: { flexDirection: 'row', justifyContent: 'space-between' },
  baseline: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1.5, borderStyle: 'dashed' },
  milestone: { flexDirection: 'row', gap: space.md, paddingVertical: space.sm },
  dot: { width: 28, height: 28, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  trigger: { gap: space.xs, paddingVertical: space.xs },
  triggerLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  memories: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
