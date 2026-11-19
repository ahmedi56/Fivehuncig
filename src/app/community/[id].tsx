import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { FEATURES } from '@/config/features';
import { ConfirmButton } from '@/components/confirm-button';
import { CharsLeft, ErrorPanel, isolate, JoinCommunity, PostCard, ReportPanel, timeAgo } from '@/components/community';
import { SafetyCard } from '@/components/safety-card';
import { Button, Chip, Panel, Screen, Text } from '@/components/ui';
import { detectCrisis } from '@/domain/safety';
import { useIsRTL, useLang, useT } from '@/i18n';
import { community, type Comment, type CommunityError, type FeedPost } from '@/services/community';
import { useAppStore } from '@/store/app-store';
import { radius, space, type, usePalette } from '@/theme';

/** One post with its replies (two levels at most), reply box, and own-content / report / block actions. */
function PostScreenScreen() {
  const t = useT();
  const lang = useLang();
  const rtl = useIsRTL();
  const p = usePalette();
  const router = useRouter();
  const { id: raw } = useLocalSearchParams<{ id: string }>();
  // The id comes from the URL: only a positive whole number is accepted. The server checks the rest.
  const id = /^\d{1,15}$/.test(raw ?? '') ? Number(raw) : undefined;

  const [post, setPost] = useState<FeedPost>();
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<CommunityError>();
  const [reply, setReply] = useState('');
  const [replyTo, setReplyTo] = useState<Comment>();
  const [busy, setBusy] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [reporting, setReporting] = useState<{ target: 'post' | 'comment'; id: number }>();
  const [editing, setEditing] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const load = useCallback(async () => {
    if (id === undefined) return setError('not_found');
    const [posts, replies] = await Promise.all([community.feed({ id, limit: 1 }), community.comments(id)]);
    if (!posts.ok) return setError(posts.error);
    const found = posts.data[0];
    if (!found) return setError('not_found');
    setPost(found);
    setComments(replies.ok ? replies.data : []);
    setError(undefined);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const crisis = detectCrisis(reply);

  const send = async () => {
    if (!post || busy || !reply.trim()) return;
    setBusy(true);
    const r = await community.addComment({ postId: post.id, body: reply, parentId: replyTo?.id, anonymous, concern: !!crisis });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    // Supporting someone else counts toward healthy points (capped per day on the phone).
    if (!post.is_mine) useAppStore.getState().logSupport();
    setReply('');
    setReplyTo(undefined);
    load();
  };

  // Opened from a link before joining: join first, then show the post.
  if (error === 'captcha_required' && !post) {
    return (
      <Screen edges={['bottom']}>
        <JoinCommunity onJoined={load} />
      </Screen>
    );
  }

  if (error && !post) {
    return (
      <Screen edges={['bottom']}>
        <ErrorPanel error={error} onRetry={error === 'not_found' ? undefined : load} />
        <Button kind="secondary" label={t.community.title} onPress={() => router.replace('/community')} />
      </Screen>
    );
  }
  if (!post) return <Screen edges={['bottom']}><Text tone="soft">{t.common.loading}</Text></Screen>;

  const top = comments.filter((c) => c.parent_id === null);
  const childrenOf = (cid: number) => comments.filter((c) => c.parent_id === cid);
  const nameOf = (c: Comment) => (c.is_mine ? t.community.you : (c.author_name ?? t.community.anonymous));

  const renderComment = (c: Comment, depth: number) => (
    <View key={c.id} style={[styles.comment, { borderColor: p.line, marginStart: depth * space.lg }]}>
      <Text variant="small" tone="soft">
        {isolate(nameOf(c))}
        {c.by_post_author ? ` · ${t.community.author}` : ''} · {timeAgo(c.created_at, t, lang)}
      </Text>
      <Text followContent>{c.body}</Text>
      <View style={styles.row}>
        {depth === 0 ? <Button kind="quiet" label={t.community.reply} onPress={() => setReplyTo(c)} /> : null}
        {c.is_mine ? (
          <ConfirmButton
            label={t.community.delete}
            confirmLabel={t.community.deleteConfirm}
            onConfirm={async () => {
              const r = await community.deleteComment(c.id);
              if (r.ok) load();
              else setError(r.error);
            }}
          />
        ) : (
          <>
            <Button kind="quiet" label={`🚩 ${t.community.report}`} onPress={() => setReporting({ target: 'comment', id: c.id })} />
            <ConfirmButton
              label={t.community.block}
              confirmLabel={t.community.blockConfirm}
              onConfirm={async () => {
                const r = await community.blockAuthor('comment', c.id);
                if (r.ok) {
                  setNotice(t.community.blocked);
                  load();
                } else setError(r.error);
              }}
            />
          </>
        )}
      </View>
    </View>
  );

  return (
    <Screen edges={['bottom']}>
      {editing !== undefined ? (
        <Panel>
          <TextInput
            value={editing}
            onChangeText={setEditing}
            multiline
            maxLength={1000}
            accessibilityLabel={t.community.edit}
            style={[type.body, styles.input, { color: p.ink, borderColor: p.control, textAlign: rtl ? 'right' : 'left' }]}
          />
          <CharsLeft value={editing} max={1000} />
          <View style={styles.row}>
            <Button kind="quiet" label={t.community.cancelReply} onPress={() => setEditing(undefined)} />
            <Button
              label={t.common.save}
              onPress={async () => {
                const r = await community.editPost(post.id, editing);
                if (!r.ok) return setError(r.error);
                setEditing(undefined);
                load();
              }}
            />
          </View>
        </Panel>
      ) : (
        <PostCard post={post} onChange={setPost} />
      )}

      <View style={styles.row}>
        {post.is_mine ? (
          <>
            <Button kind="quiet" label={t.community.edit} onPress={() => setEditing(post.body)} />
            <ConfirmButton
              label={t.community.delete}
              confirmLabel={t.community.deleteConfirm}
              onConfirm={async () => {
                const r = await community.deletePost(post.id);
                if (r.ok) router.replace('/community');
                else setError(r.error);
              }}
            />
          </>
        ) : (
          <>
            <Button kind="quiet" label={`🚩 ${t.community.report}`} onPress={() => setReporting({ target: 'post', id: post.id })} />
            <ConfirmButton
              label={t.community.block}
              confirmLabel={t.community.blockConfirm}
              onConfirm={async () => {
                const r = await community.blockAuthor('post', post.id);
                if (r.ok) router.replace('/community');
                else setError(r.error);
              }}
            />
          </>
        )}
      </View>

      {reporting ? <ReportPanel target={reporting.target} id={reporting.id} onDone={() => setReporting(undefined)} /> : null}
      {notice ? <Text tone="lung" accessibilityLiveRegion="polite">{notice}</Text> : null}
      {error ? <ErrorPanel error={error} /> : null}

      <Text variant="heading">{t.community.replies(comments.length)}</Text>
      {top.map((c) => [renderComment(c, 0), ...childrenOf(c.id).map((child) => renderComment(child, 1))])}

      <Panel>
        {replyTo ? (
          <View style={styles.row}>
            <Text variant="small" tone="soft" style={{ flex: 1 }}>
              {t.community.replyingTo(isolate(nameOf(replyTo)))}
            </Text>
            <Button kind="quiet" label={t.community.cancelReply} onPress={() => setReplyTo(undefined)} />
          </View>
        ) : null}
        <TextInput
          value={reply}
          onChangeText={setReply}
          placeholder={t.community.replyPlaceholder}
          placeholderTextColor={p.inkSoft}
          accessibilityLabel={t.community.replyPlaceholder}
          multiline
          maxLength={500}
          style={[type.body, styles.input, { color: p.ink, borderColor: p.control, textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }]}
        />
        <CharsLeft value={reply} max={500} />
        {crisis ? <SafetyCard kind={crisis} /> : null}
        <View style={styles.row} accessibilityRole="radiogroup">
          <Text variant="small" tone="soft">
            {t.community.composer.postAs}
          </Text>
          <Chip role="radio" label={t.community.composer.anonymously} selected={anonymous} onPress={() => setAnonymous(true)} />
          <Chip role="radio" label={t.community.join.nickname} selected={!anonymous} onPress={() => setAnonymous(false)} />
        </View>
        <Button label={t.community.sendReply} loading={busy} disabled={!reply.trim()} onPress={send} />
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.xs },
  comment: { borderStartWidth: 2, paddingStart: space.md, paddingVertical: space.xs, gap: space.xxs },
  input: { borderWidth: 1, borderRadius: radius.sm, padding: space.md, minHeight: 72, textAlignVertical: 'top' },
});

/** Left out of the test release (see src/config/features.ts): back to Today. */
export default function PostScreen() {
  return FEATURES.community ? <PostScreenScreen /> : <Redirect href="/" />;
}
