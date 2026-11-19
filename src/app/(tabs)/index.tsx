import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { FEATURES } from '@/config/features';
import { FollowUpCard } from '@/components/craving-check';
import { ChallengeCard } from '@/components/journey';
import { Icon } from '@/components/icons';
import { Button, Panel, pressedStyle, Row, Screen, Text } from '@/components/ui';
import { suggestArticle } from '@/content/suggest';
import { nextMilestone } from '@/domain/health';
import { cravingTimeInsight, DAY_PARTS } from '@/domain/insights';
import { weekKey } from '@/domain/journey';
import { readinessNudge } from '@/domain/nudge';
import { dueFollowUps, type CravingRating } from '@/domain/ratings';
import { currentGap, lastSmoke, nextAllowedAt, targetPerDay } from '@/domain/schedule';
import {
  cigarettesAvoided,
  countToday,
  cravingsBeaten,
  formatMoney,
  moneySaved,
  smokeFreeSince,
} from '@/domain/stats';
import { DAY, dayKey, formatClock, formatDuration } from '@/domain/time';
import { ANSWER_CARDS, cardAt, hiddenToday, MEDICINE_CARD_DAYS, todayCards, type TodayCard } from '@/domain/today-cards';
import type { Profile, SmokeEvent } from '@/domain/types';
import { useJourney } from '@/hooks/use-journey';
import { useNow } from '@/hooks/use-now';
import { formatNumber, useLang, useT } from '@/i18n';
import { ARTICLES } from '@/i18n/articles';
import { changeMode, recordSmoke, undoSmoke } from '@/services/actions';
import { useAppStore } from '@/store/app-store';
import { radius, space, usePalette } from '@/theme';

const UNDO_WINDOW = 10_000;
// "Done for today" on a card is remembered on the phone for the rest of the local day.
const HIDDEN_KEY = 'fivehuncig-today-hidden';

export default function Today() {
  const now = useNow();
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const p = usePalette();
  // 200 px on a phone, smaller on narrow or zoomed screens (200% browser zoom) so it never runs off the edge.
  // With one card below it, Today fits a 375×812 phone without scrolling.
  const halo = Math.min(200, useWindowDimensions().width - 2 * space.md);
  const profile = useAppStore((s) => s.profile);
  const smokes = useAppStore((s) => s.smokes);
  const cravings = useAppStore((s) => s.cravings);
  const plans = useAppStore((s) => s.plans);
  const reasons = useAppStore((s) => s.reasons);
  const ratings = useAppStore((s) => s.ratings);
  const nudgeDismissedAt = useAppStore((s) => s.nudgeDismissedAt);
  const journey = useJourney();
  const [lastLogged, setLastLogged] = useState<SmokeEvent>();
  const [justAnswered, setJustAnswered] = useState<CravingRating>();
  // Tabs stay mounted: forget the answered card when the member leaves, so the next question can show.
  useFocusEffect(useCallback(() => () => setJustAnswered(undefined), []));
  const undoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [skips, setSkips] = useState(0);
  const [hidden, setHidden] = useState<TodayCard[]>([]);
  const day = dayKey(now);

  useEffect(() => () => clearTimeout(undoTimer.current), []);
  useEffect(() => {
    AsyncStorage.getItem(HIDDEN_KEY)
      .then((raw) => setHidden(hiddenToday(raw ? JSON.parse(raw) : undefined, day)))
      .catch(() => undefined);
  }, [day]);

  if (!profile) return null;

  const logSmoke = async () => {
    const event = await recordSmoke();
    setLastLogged(event);
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setLastLogged(undefined), UNDO_WINDOW);
    if (profile.mode === 'quit') router.push({ pathname: '/slip', params: { smoke: event.id } });
  };

  const undo = () => {
    if (!lastLogged) return;
    undoSmoke(lastLogged.id);
    setLastLogged(undefined);
  };

  const hideCard = (card: TodayCard) => {
    const next = [...hidden, card];
    setHidden(next);
    AsyncStorage.setItem(HIDDEN_KEY, JSON.stringify({ day, cards: next })).catch(() => undefined);
  };

  const today = countToday(smokes, now);
  const avoided = cigarettesAvoided(smokes, profile, now);
  const saved = moneySaved(avoided, profile);
  const beaten = cravingsBeaten(cravings);
  const nudge = nudgeDismissedAt && now - nudgeDismissedAt < 7 * DAY ? undefined : readinessNudge(profile, smokes, now);
  const plan = plans.length ? plans[Math.floor(now / DAY) % plans.length] : undefined;
  const reason = reasons.length ? reasons[Math.floor(now / (6 * 3_600_000)) % reasons.length] : undefined;
  const timing = cravingTimeInsight(cravings, smokes, now);
  const article = suggestArticle(profile, smokes, now);
  // The answered card stays (with its thank-you) until the member leaves; the next one waits.
  const followUp = justAnswered ?? dueFollowUps(ratings, now)[0];
  const challenge = !!journey?.challenges.some((c) => c.week === weekKey(now));

  // One card at a time (src/domain/today-cards.ts): the screen fits without scrolling.
  const cards = todayCards(
    { followUp: !!followUp, nudge: !!nudge, medicine: now - profile.startedAt < MEDICINE_CARD_DAYS * DAY, risk: !!timing, challenge: challenge && FEATURES.extras, reason: !!reason, article: FEATURES.learn },
    hidden,
  );
  const card = cardAt(cards, skips);
  const position = card ? cards.indexOf(card) + 1 : 0;

  const cardBody = (): ReactNode => {
    switch (card) {
      case 'followUp':
        return followUp ? <FollowUpCard key={followUp.id} rating={followUp} onAnswer={setJustAnswered} /> : null;
      case 'nudge':
        return nudge ? (
          <Panel tone="lung">
            <Text>{nudge.kind === 'try-cutdown' ? t.today.nudgeCutdown(nudge.drop) : t.today.nudgeQuit}</Text>
            <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
              <Button
                label={nudge.kind === 'try-cutdown' ? t.today.startTimer : t.today.trySmokeFree}
                onPress={() => changeMode(nudge.kind === 'try-cutdown' ? 'cutdown' : 'quit')}
              />
              <Button kind="quiet" label={t.common.notNow} onPress={() => useAppStore.getState().dismissNudge()} />
            </View>
          </Panel>
        ) : null;
      case 'medicine':
        return (
          <>
            <Text>{t.today.medsCard}</Text>
            <Button kind="secondary" label={t.today.medsButton} onPress={() => router.push('/help')} />
          </>
        );
      case 'risk':
        return timing ? (
          <>
            <Text>
              {t.insights.body(timing.total, timing.count, t.insights.parts[timing.part], `${DAY_PARTS[timing.part].from}:00–${DAY_PARTS[timing.part].to}:00`)}
            </Text>
            {plan ? (
              <Text variant="bodyStrong">
                {t.today.yourPlan}: {t.plan.sentence(plan.trigger, plan.action)}
              </Text>
            ) : null}
          </>
        ) : null;
      case 'challenge':
        return journey ? <ChallengeCard data={journey} now={now} /> : null;
      case 'reason':
        return reason ? (
          <>
            <Text variant="small" tone="soft">
              {t.today.why}
            </Text>
            <Text variant="heading" followContent>
              {reason.text}
            </Text>
          </>
        ) : null;
      case 'plan':
        return plan ? (
          <>
            <Text variant="small" tone="soft">
              {t.today.yourPlan}
            </Text>
            <Text variant="bodyStrong">{t.plan.sentence(plan.trigger, plan.action)}</Text>
          </>
        ) : (
          <>
            <Text>{t.today.makePlanPrompt}</Text>
            <Button kind="secondary" label={t.today.makePlan} onPress={() => router.push('/plans')} />
          </>
        );
      case 'article':
        return (
          <>
            <Text variant="small" tone="soft">
              {t.learn.suggested}
            </Text>
            <Row
              icon={ARTICLES[article].icon}
              title={t.learn.articles[article].title}
              subtitle={t.learn.articles[article].summary}
              onPress={() => router.push({ pathname: '/learn/[id]', params: { id: article } })}
            />
          </>
        );
      default:
        return null;
    }
  };

  // Answer cards and the challenge bring their own panel; the others sit in Mahla's card.
  const ownPanel = card === 'followUp' || card === 'nudge' || card === 'challenge';

  return (
    <Screen>
      <View style={styles.topRow}>
        <Text variant="small" tone="soft" style={{ flex: 1 }}>
          {t.modes[profile.mode].status}
        </Text>
        {/* Settings, plans, reasons and help lines live here: a visible word, not just a menu icon. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.more.open}
          onPress={() => router.push('/more')}
          style={({ pressed }) => [styles.moreButton, { borderColor: p.line, backgroundColor: p.surface }, pressed && pressedStyle]}>
          <Icon name="more" color={p.lung} size={20} />
          <Text variant="bodyStrong" tone="lung">
            {t.more.open}
          </Text>
        </Pressable>
      </View>

      <Status profile={profile} smokes={smokes} now={now} />

      {/* Built for the hard moment: help is the one big thing on the screen. */}
      <View style={styles.cravingArea}>
        <View style={[styles.halo, { width: halo, height: halo, backgroundColor: p.lungSoft }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.today.craving}
            accessibilityHint={t.today.cravingHint}
            // One tap and it starts: no question, no list. SOS keeps every other tool.
            onPress={() => router.push({ pathname: '/breathe', params: { quick: '1' } })}
            style={({ pressed }) => [styles.cravingButton, { width: halo * 0.8, height: halo * 0.8, backgroundColor: p.lung }, pressed && pressedStyle]}>
            <Text variant="heading" tone="onLung" style={styles.center}>
              {t.today.craving}
            </Text>
          </Pressable>
        </View>
        <Text variant="small" tone="soft" style={styles.center}>
          {t.today.cravingNote}
        </Text>
      </View>

      {lastLogged ? (
        <Panel tone="sky" style={styles.undo}>
          <Text style={{ flex: 1 }} accessibilityLiveRegion="polite">
            {lastLogged.early ? t.today.loggedEarly : t.today.logged}
          </Text>
          <Button kind="quiet" label={t.common.undo} onPress={undo} />
        </Panel>
      ) : null}

      {card ? (
        <View style={{ gap: space.xs }} accessibilityLabel={t.today.cardOf(position, cards.length)}>
          {ownPanel ? (
            cardBody()
          ) : (
            <Panel>
              <Text variant="small" tone="lung">
                {t.guide.name} · {t.today.forNow}
              </Text>
              {cardBody()}
            </Panel>
          )}
          <View style={styles.cardActions}>
            {!ANSWER_CARDS.includes(card) ? <Button kind="quiet" label={t.today.hideCard} onPress={() => hideCard(card)} /> : null}
            {cards.length > 1 ? <Button kind="quiet" label={t.today.nextCard} onPress={() => setSkips(skips + 1)} /> : null}
          </View>
        </View>
      ) : null}

      {/* Progress as one short line; counting today matters outside quit mode. */}
      <View style={{ gap: space.xxs }}>
        {profile.mode !== 'quit' ? (
          <Text variant="bodyStrong" style={styles.center}>
            {formatNumber(today, lang)}{' '}
            {profile.mode === 'cutdown' ? t.today.todayAim(targetPerDay(profile, now)) : t.today.todayUsual(profile.cigsPerDay)}
          </Text>
        ) : null}
        <Text variant="small" tone="soft" style={styles.center}>
          {saved > 0 || avoided > 0 || beaten > 0
            ? t.today.summary(formatMoney(saved, profile.currency, (x) => formatNumber(x, lang)), avoided, beaten)
            : t.today.summaryEmpty}
        </Text>
      </View>

      <Button
        kind="quiet"
        label={profile.mode === 'quit' ? t.today.slipped : t.today.smokedOne}
        accessibilityHint={t.today.logHint}
        onPress={logSmoke}
      />
    </Screen>
  );
}

/** One quiet status line above the craving button: time smoke-free, the timer, or time since the last one. */
function Status({ profile, smokes, now }: { profile: Profile; smokes: SmokeEvent[]; now: number }) {
  const t = useT();
  const lang = useLang();
  const duration = (ms: number) => formatDuration(ms, t.units, (x) => formatNumber(x, lang));

  let label: string;
  let value: string | undefined;
  let valueA11y: string | undefined;
  let note: string | undefined;
  if (profile.mode === 'cutdown') {
    const allowedAt = nextAllowedAt(profile, smokes, now);
    const waiting = allowedAt !== undefined && now < allowedAt;
    label = waiting ? t.today.nextIn : t.today.timerDone;
    // A tick, not "Now": the timer marks a wait done, it never invites a cigarette.
    value = waiting ? formatClock(allowedAt - now) : '✓';
    valueA11y = waiting ? t.today.nextInA11y(duration(allowedAt - now)) : t.today.canSmokeNow;
    note = t.today.gapThisWeek(duration(currentGap(profile, now)));
  } else if (profile.mode === 'quit') {
    const since = now - smokeFreeSince(smokes, profile);
    const next = nextMilestone(since);
    label = t.today.smokeFreeFor;
    value = duration(since);
    note = next ? t.today.atMilestone(t.milestones[next.id].title, t.milestones[next.id].detail) : undefined;
  } else {
    const last = lastSmoke(smokes);
    label = last ? t.today.sinceLast : t.today.nothingYet;
    value = last ? duration(now - last.at) : undefined;
    note = t.today.watchNote;
  }

  return (
    <View style={styles.status}>
      <Text tone="soft" style={styles.center}>
        {label}
      </Text>
      {value ? (
        <Text variant="title" style={[styles.center, styles.statusValue]} accessibilityLabel={valueA11y} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
      ) : null}
      {note ? (
        <Text variant="small" tone="soft" style={[styles.center, styles.note]}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center' },
  moreButton: { flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: 44, paddingHorizontal: space.md, borderRadius: radius.pill, borderWidth: 1 },
  status: { alignItems: 'center', gap: space.xxs, paddingTop: space.sm },
  // Clocks and durations keep a steady width as they tick.
  statusValue: { fontVariant: ['tabular-nums'] },
  note: { maxWidth: 320 },
  center: { textAlign: 'center' },
  cravingArea: { alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
  // A soft ring around the button: a large, calm target, easy to hit with a shaking hand.
  halo: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  cravingButton: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.md,
  },
  undo: { flexDirection: 'row', alignItems: 'center' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: space.sm },
});
