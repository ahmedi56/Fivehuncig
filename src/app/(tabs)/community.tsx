import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FEATURES } from '@/config/features';
import { ErrorPanel, JoinCommunity, PostCard, useCommunityMe } from '@/components/community';
import { IconButton } from '@/components/icon-button';
import { Button, Chip, Panel, Screen, Text, pressedStyle } from '@/components/ui';
import { DAY } from '@/domain/time';
import { useNow } from '@/hooks/use-now';
import { useLang, useT } from '@/i18n';
import { community, ROOMS, type CommunityError, type FeedPost, type Room } from '@/services/community';
import { radius, shadows, space, usePalette } from '@/theme';

/** Peer support: "I need support" first, then today's question, then the feed. */
function CommunityScreen() {
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const p = usePalette();
  const [state, reload] = useCommunityMe();
  const [room, setRoom] = useState<Room>();
  const [allLanguages, setAllLanguages] = useState(false);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<CommunityError>();
  const [unread, setUnread] = useState(0);
  const now = useNow(60 * 60_000);
  const question = t.community.questions[Math.floor(now / DAY) % t.community.questions.length];

  const load = useCallback(
    async (append?: FeedPost) => {
      setLoading(true);
      const r = await community.feed({ room, lang: allLanguages ? undefined : lang, before: append });
      setLoading(false);
      if (!r.ok) return setError(r.error);
      setError(undefined);
      setMore(r.data.length === 20);
      setPosts((list) => (append ? [...list, ...r.data] : r.data));
    },
    [room, allLanguages, lang],
  );

  const ready = state.status === 'ready';
  useFocusEffect(
    useCallback(() => {
      if (!ready) return;
      load();
      community.notifications().then((r) => r.ok && setUnread(r.data.filter((n) => !n.read).length));
    }, [ready, load]),
  );

  const update = (next: FeedPost) => setPosts((list) => list.map((x) => (x.id === next.id ? next : x)));

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <View style={styles.header}>
          <Text variant="title" accessibilityRole="header" style={{ flex: 1 }}>
            {t.community.title}
          </Text>
          {ready ? (
            <IconButton icon="bell" label={t.community.activity.open(unread)} onPress={() => router.push('/community/activity')}>
              {unread ? (
                <View style={[styles.badge, { backgroundColor: p.ember }]}>
                  <Text variant="caption" tone="onLung">
                    {unread}
                  </Text>
                </View>
              ) : null}
            </IconButton>
          ) : null}
        </View>
        <Text variant="heading">{t.community.hero}</Text>
        <Text tone="soft">{t.community.heroSub}</Text>

        <Button big label={t.community.needSupport} onPress={() => router.push('/support')} />

        {state.status === 'loading' ? <Text tone="soft">{t.common.loading}</Text> : null}
        {state.status === 'error' ? <ErrorPanel error={state.error} onRetry={reload} /> : null}
        {state.status === 'join' ? <JoinCommunity onJoined={reload} /> : null}

        {ready ? (
          <>
            <Panel tone="sky">
              <Text variant="small" tone="soft">
                {t.community.todayQuestion}
              </Text>
              <Text variant="heading">{question}</Text>
              <Button
                kind="secondary"
                label={t.community.answer}
                onPress={() => router.push({ pathname: '/community/new', params: { type: 'daily_prompt', question } })}
              />
            </Panel>

            <View style={styles.chips} accessibilityRole="tablist">
              <Chip role="tab" label={t.community.rooms.all} selected={!room} onPress={() => setRoom(undefined)} />
              {ROOMS.map((r) => (
                <Chip role="tab" key={r} label={t.community.rooms[r]} selected={room === r} onPress={() => setRoom(r)} />
              ))}
              <Chip
                label={allLanguages ? t.community.allLanguages : t.community.myLanguage}
                selected={allLanguages}
                onPress={() => setAllLanguages(!allLanguages)}
              />
            </View>

            {error ? <ErrorPanel error={error} onRetry={() => load()} /> : null}

            {!error && !loading && posts.length === 0 ? (
              <Panel>
                <Text variant="heading">{t.community.empty}</Text>
                <Text tone="soft">{t.community.emptyBody}</Text>
                <Button label={t.community.emptyCta} onPress={() => router.push('/community/new')} />
              </Panel>
            ) : null}

            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onChange={update}
                onOpen={() => router.push({ pathname: '/community/[id]', params: { id: String(post.id) } })}
              />
            ))}

            {more ? <Button kind="secondary" label={t.community.loadMore} disabled={loading} onPress={() => load(posts[posts.length - 1])} /> : null}
            <Text variant="small" tone="soft">
              {t.community.peerNote}
            </Text>
            {/* Room at the bottom so the floating Share button never covers the last post. */}
            <View style={{ height: 64 }} />
          </>
        ) : null}
      </Screen>

      {/* The empty state has its own share button; don't cover it. */}
      {ready && posts.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.community.share}
          onPress={() => router.push('/community/new')}
          style={({ pressed }) => [styles.fab, { backgroundColor: p.lung }, pressed && pressedStyle]}>
          <Text tone="onLung" variant="bodyStrong">
            + {t.community.share}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  badge: { position: 'absolute', top: 4, end: 2, minWidth: 18, height: 18, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  fab: { position: 'absolute', bottom: space.lg, end: space.lg, minHeight: 52, paddingHorizontal: space.lg, borderRadius: radius.pill, justifyContent: 'center', boxShadow: shadows.raised },
});

/** Left out of the test release (see src/config/features.ts): back to Today. */
export default function Community() {
  return FEATURES.community ? <CommunityScreen /> : <Redirect href="/" />;
}
