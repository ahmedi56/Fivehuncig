import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { bestTool, roundDrop, type CravingRating, type RatedTool } from '@/domain/ratings';
import { formatDecimal, useLang, useT } from '@/i18n';
import { answerFollowUp, recordRating } from '@/services/actions';
import { useAppStore } from '@/store/app-store';
import { useSosSession } from '@/store/sos-session';
import { space } from '@/theme';

import { CravingScale } from './craving-scale';
import { Button, Panel, pressedStyle, Text } from './ui';

/**
 * "How strong is the craving right now?" Asked once, on the SOS screen, and optional. Once
 * answered it folds to one line that can be tapped to change it. The tools never ask again.
 */
export function CravingNow() {
  const t = useT();
  const level = useSosSession((s) => s.cravingLevel);
  const [editing, setEditing] = useState(false);
  if (level !== undefined && !editing) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t.ratings.level(level)}. ${t.ratings.change}`}
        onPress={() => setEditing(true)}
        style={({ pressed }) => [{ flexDirection: 'row', gap: space.sm, alignItems: 'baseline', flexWrap: 'wrap' }, pressed && pressedStyle]}>
        <Text variant="bodyStrong">{t.ratings.level(level)}</Text>
        <Text tone="lung">{t.ratings.change}</Text>
      </Pressable>
    );
  }
  return (
    <Panel>
      <Text variant="heading" accessibilityRole="header">
        {t.ratings.beforeTitle}
      </Text>
      <CravingScale
        value={level}
        onChange={(v) => {
          useSosSession.getState().setCravingLevel(v);
          setEditing(false);
        }}
      />
    </Panel>
  );
}

/**
 * "Craving now?" at the end of a tool. Saves the rating (and schedules the follow-up) once. The
 * "before" score is the one given on the SOS screen, or the end score of the tool used just before.
 */
export function AfterCheck({ tool, onSaved }: { tool: RatedTool; onSaved?: () => void }) {
  const t = useT();
  const [after, setAfter] = useState<number>();
  const [saved, setSaved] = useState(false);
  if (saved) {
    return (
      <Text tone="soft" accessibilityLiveRegion="polite">
        {t.ratings.saved}
      </Text>
    );
  }
  return (
    <Panel>
      <Text variant="heading" accessibilityRole="header">
        {t.ratings.afterTitle}
      </Text>
      <CravingScale value={after} onChange={setAfter} />
      <Button
        label={t.ratings.save}
        disabled={after === undefined}
        onPress={() => {
          if (after === undefined) return;
          setSaved(true);
          onSaved?.();
          const session = useSosSession.getState();
          recordRating(tool, after, session.cravingLevel);
          session.setCravingLevel(after);
        }}
      />
      <Text variant="small" tone="soft">
        {t.ratings.note}
      </Text>
    </Panel>
  );
}

/**
 * Wraps an SOS tool: the tool gets the whole screen, and when it's `done` one question asks how
 * strong the craving is now. One rating per visit, so playing another round doesn't ask again.
 */
export function CravingCheck({ tool, done, children }: { tool: RatedTool; done: boolean; children: ReactNode }) {
  const t = useT();
  const [rated, setRated] = useState(false);
  return (
    <>
      {children}
      {rated ? <Text tone="soft">{t.ratings.saved}</Text> : done ? <AfterCheck tool={tool} onSaved={() => setRated(true)} /> : null}
    </>
  );
}

/** "Your best tool so far", from the member's own before/after ratings. */
export function BestTool({ hideEmpty, bare }: { hideEmpty?: boolean; bare?: boolean }) {
  const t = useT();
  const lang = useLang();
  const ratings = useAppStore((s) => s.ratings);
  const best = bestTool(ratings);
  if (!best && hideEmpty) return null;
  const line = best ? (
    <Text variant="bodyStrong">{t.ratings.best(t.ratings.tools[best.tool], formatDecimal(roundDrop(best.averageDrop), lang), best.uses)}</Text>
  ) : (
    <Text tone="soft">{t.ratings.bestEmpty}</Text>
  );
  // Inside a panel that already has a heading, the line stands alone.
  if (bare) return line;
  return (
    <Panel tone="lung">
      <Text variant="small" tone="soft">
        {t.ratings.bestTitle}
      </Text>
      {line}
    </Panel>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "After Breathing at 14:05, did you smoke?" with two answers, then a thank-you that never scolds. */
export function FollowUpCard({ rating, onAnswer }: { rating: CravingRating; onAnswer?: (rating: CravingRating) => void }) {
  const t = useT();
  const [answer, setAnswer] = useState<boolean>();
  const time = new Date(rating.at);
  if (answer !== undefined) {
    return (
      <Panel tone="sky">
        <Text accessibilityLiveRegion="polite">{answer ? t.ratings.thanksYes : t.ratings.thanksNo}</Text>
      </Panel>
    );
  }
  const reply = (smoked: boolean) => {
    setAnswer(smoked);
    onAnswer?.(rating);
    answerFollowUp(rating.id, smoked);
  };
  return (
    <Panel tone="sky">
      <Text variant="bodyStrong">{t.ratings.followUpQuestion(t.ratings.tools[rating.tool], `${pad(time.getHours())}:${pad(time.getMinutes())}`)}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        <Button kind="secondary" label={t.ratings.no} onPress={() => reply(false)} style={{ flexGrow: 1 }} />
        <Button kind="secondary" label={t.ratings.yes} onPress={() => reply(true)} style={{ flexGrow: 1 }} />
      </View>
    </Panel>
  );
}
