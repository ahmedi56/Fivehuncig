import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View } from 'react-native';

import { formatNumber, useLang, useT } from '@/i18n';
import {
  community,
  REACTIONS,
  REPORT_REASONS,
  type CommunityError,
  type FeedPost,
  type Me,
  type Reaction,
  type ReportReason,
} from '@/services/community';
import { radius, space, usePalette } from '@/theme';
import { isolate, timeAgo } from '@/utils/community-format';

import { useCaptcha } from './captcha';
import { Button, Chip, Field, Panel, Text, tap, pressedStyle } from './ui';

// Screens import these from here, next to the cards that use them.
export { isolate, timeAgo };
export { CharsLeft } from './chars-left';

export type CommunityState =
  | { status: 'loading' }
  | { status: 'error'; error: CommunityError }
  | { status: 'join' }
  | { status: 'ready'; me: Me };

/** Loads the member's community profile whenever the screen comes into focus. */
export function useCommunityMe(): [CommunityState, () => void] {
  const [state, setState] = useState<CommunityState>(() =>
    community.configured() ? { status: 'loading' } : { status: 'error', error: 'not_configured' },
  );
  const load = useCallback(() => {
    if (!community.configured()) return;
    community.me().then((r) => {
      if (!r.ok) setState({ status: 'error', error: r.error });
      else setState(r.data ? { status: 'ready', me: r.data } : { status: 'join' });
    });
  }, []);
  useFocusEffect(load);
  return [state, load];
}

export function ErrorPanel({ error, onRetry }: { error: CommunityError; onRetry?: () => void }) {
  const t = useT();
  return (
    <Panel tone="sky">
      <Text accessibilityLiveRegion="polite">{t.community.errors[error]}</Text>
      {onRetry && error !== 'not_configured' ? <Button kind="secondary" label={t.community.retry} onPress={onRetry} /> : null}
    </Panel>
  );
}

/** First visit: nickname, guidelines, privacy. No email or phone is ever asked. */
export function JoinCommunity({ onJoined }: { onJoined: () => void }) {
  const t = useT();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<CommunityError>();
  const [busy, setBusy] = useState(false);
  const { captcha, getToken } = useCaptcha();

  const suggest = () => {
    const words = ['Calm', 'Brave', 'Steady', 'Fresh', 'Clear', 'Free'];
    const nouns = ['Breath', 'Wave', 'Path', 'Air', 'Step', 'Sky'];
    const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];
    setNickname(`${pick(words)}${pick(nouns)}${Math.floor(10 + Math.random() * 90)}`);
  };

  const join = async () => {
    setBusy(true);
    setError(undefined);
    // First join on this phone: prove it's a person (usually invisible), then sign in anonymously.
    if (!(await community.hasSession())) {
      const check = await getToken();
      if (!check.ok) {
        setBusy(false);
        // Closing the puzzle is a choice, not an error: just let them tap Join again.
        if (check.reason === 'failed') setError('captcha_failed');
        return;
      }
      const s = await community.signIn(check.token);
      if (!s.ok) {
        setBusy(false);
        return setError(s.error);
      }
    }
    const r = await community.setProfile(nickname);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    onJoined();
  };

  return (
    <Panel>
      <Text variant="heading" accessibilityRole="header">
        {t.community.join.title}
      </Text>
      <Text>{t.community.join.body}</Text>
      <Field label={t.community.join.nickname} value={nickname} onChangeText={setNickname} maxLength={24} autoCapitalize="none" autoCorrect={false} />
      <Button kind="quiet" label={t.community.join.suggest} onPress={suggest} />
      <Text variant="bodyStrong">{t.community.join.guidelinesTitle}</Text>
      {t.community.join.guidelines.map((g) => (
        <Text key={g} variant="small">
          • {g}
        </Text>
      ))}
      <Text variant="small" tone="soft">
        {t.community.join.privacy}
      </Text>
      {error ? (
        <Text variant="small" tone="ember" accessibilityLiveRegion="polite">
          {t.community.errors[error]}
        </Text>
      ) : null}
      <Button label={t.community.join.accept} loading={busy} disabled={nickname.trim().length < 2} onPress={join} />
      {captcha}
    </Panel>
  );
}

/** The five supportive reactions. Toggling is optimistic and rolls back if the server refuses. */

export function ReactionBar({ post, onChange }: { post: FeedPost; onChange: (post: FeedPost) => void }) {
  const t = useT();
  const lang = useLang();
  const p = usePalette();
  const toggle = async (kind: Reaction) => {
    tap();
    const on = !post.my_reactions.includes(kind);
    const count = (post.reactions[kind] ?? 0) + (on ? 1 : -1);
    const next: FeedPost = {
      ...post,
      my_reactions: on ? [...post.my_reactions, kind] : post.my_reactions.filter((k) => k !== kind),
      reactions: { ...post.reactions, [kind]: Math.max(0, count) },
    };
    onChange(next);
    const r = await community.react(post.id, kind, on);
    if (!r.ok) onChange(post);
  };
  return (
    <View style={styles.reactions}>
      {REACTIONS.filter((k) => k !== 'congrats' || post.type === 'milestone' || post.reactions.congrats).map((kind) => {
        const mine = post.my_reactions.includes(kind);
        const count = post.reactions[kind] ?? 0;
        const label = t.community.reactions[kind];
        return (
          <Pressable
            key={kind}
            accessibilityRole="button"
            aria-selected={mine}
            accessibilityLabel={t.community.reactionA11y(label, count, mine)}
            onPress={() => toggle(kind)}
            style={({ pressed }) => [styles.reaction, { backgroundColor: mine ? p.lungSoft : p.surface, borderColor: mine ? p.lung : p.control }, pressed && pressedStyle]}>
            {/* Emoji + count; the full label is in the accessibility name and appears when selected. */}
            <Text variant="small">
              {mine ? label : label.split(' ')[0]}
              {count ? ` ${formatNumber(count, lang)}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PostCard({
  post,
  onChange,
  onOpen,
}: {
  post: FeedPost;
  onChange: (post: FeedPost) => void;
  onOpen?: () => void;
}) {
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const p = usePalette();
  const author = post.is_mine ? t.community.you : (post.author_name ?? t.community.anonymous);
  const body = (
    <>
      <Text variant="small" tone="soft">
        {t.community.types[post.type]} · {isolate(author)} · {timeAgo(post.created_at, t, lang)}
        {post.edited ? ` · ${t.community.edited}` : ''}
      </Text>
      {/* In the feed (onOpen) long posts show 6 lines; the post screen shows all of it. */}
      <Text followContent style={{ marginTop: space.xxs }} numberOfLines={onOpen ? 6 : undefined}>
        {post.body}
      </Text>
    </>
  );
  return (
    <View style={[styles.card, { backgroundColor: p.surface, borderColor: post.type === 'craving' ? p.ember : p.line }]}>
      {onOpen ? (
        <Pressable accessibilityRole="button" accessibilityHint={t.community.reply} onPress={onOpen} style={({ pressed }) => [{ gap: space.xxs }, pressed && pressedStyle]}>
          {body}
        </Pressable>
      ) : (
        body
      )}
      {post.type === 'difficult_day' ? (
        <Text variant="small" tone="lung">
          {t.community.setbackNote}
        </Text>
      ) : null}
      <ReactionBar post={post} onChange={onChange} />
      <View style={styles.actions}>
        {onOpen ? <Button kind="quiet" label={`💬 ${t.community.replies(post.comment_count)}`} onPress={onOpen} /> : null}
        <Button
          kind="quiet"
          label={post.saved ? `🔖 ${t.community.saved}` : `🔖 ${t.community.save}`}
          onPress={async () => {
            onChange({ ...post, saved: !post.saved });
            const r = await community.save(post.id, !post.saved);
            if (!r.ok) onChange(post);
          }}
        />
      </View>
      {post.type === 'craving' ? <Button kind="secondary" label={t.community.startSurf} onPress={() => router.push('/urge-surf')} /> : null}
    </View>
  );
}

/**
 * Moves keyboard and screen-reader focus to the returned view whenever `key` changes, so a
 * panel that appears elsewhere on the page is where the member continues.
 */
function useFocusHere(key: unknown) {
  const ref = useRef<View>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (Platform.OS === 'web') (node as unknown as HTMLElement).focus();
    else AccessibilityInfo.sendAccessibilityEvent(node, 'focus');
  }, [key]);
  return ref;
}

/**
 * Report a post or reply, with a reason. Shown inline (no blocking dialogs) but it takes focus
 * when it opens, and gives it back to the Report button when it closes (web).
 */
export function ReportPanel({ target, id, onDone }: { target: 'post' | 'comment'; id: number; onDone: () => void }) {
  const t = useT();
  const [reason, setReason] = useState<ReportReason>();
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'sent' | CommunityError>('idle');
  const [opener] = useState(() => (Platform.OS === 'web' && typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null));
  const sent = state === 'sent';
  const focusRef = useFocusHere(sent);

  const close = () => {
    // Before unmounting: the Cancel/Done button is about to disappear with the panel.
    if (opener?.isConnected) opener.focus();
    onDone();
  };

  if (sent) {
    return (
      <Panel tone="lung">
        <View ref={focusRef} tabIndex={-1} accessible style={styles.focusTarget}>
          <Text accessibilityLiveRegion="polite">{t.community.reportSheet.sent}</Text>
        </View>
        <Button kind="secondary" label={t.common.done} onPress={close} />
      </Panel>
    );
  }
  return (
    <Panel>
      <View ref={focusRef} tabIndex={-1} accessible accessibilityRole="header" style={styles.focusTarget}>
        <Text variant="heading">{t.community.reportSheet.why}</Text>
      </View>
      <View style={styles.reactions} accessibilityRole="radiogroup">
        {REPORT_REASONS.map((r) => (
          <Chip role="radio" key={r} label={t.community.reportSheet.reasons[r]} selected={reason === r} onPress={() => setReason(r)} />
        ))}
      </View>
      <Field label={t.community.reportSheet.note} value={note} onChangeText={setNote} maxLength={300} />
      {state !== 'idle' ? (
        <Text tone="ember" accessibilityLiveRegion="polite">
          {t.community.errors[state]}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button kind="quiet" label={t.community.cancelReply} onPress={close} />
        <Button
          label={t.community.reportSheet.send}
          disabled={!reason}
          onPress={async () => {
            if (!reason) return;
            const r = await community.report(target, id, reason, note);
            setState(r.ok ? 'sent' : r.error);
          }}
        />
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.md, borderWidth: 1, padding: space.md, gap: space.sm },
  reactions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  reaction: { minHeight: 44, minWidth: 44, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: space.sm, justifyContent: 'center', alignItems: 'center' },
  focusTarget: { outlineStyle: 'none' } as object,
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, alignItems: 'center' },
});
