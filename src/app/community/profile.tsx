import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { FEATURES } from '@/config/features';
import { ErrorPanel, JoinCommunity, PostCard, useCommunityMe } from '@/components/community';
import { ConfirmButton } from '@/components/confirm-button';
import { Button, Chip, Field, Panel, Row, Screen, Text } from '@/components/ui';
import { useT } from '@/i18n';
import { community, type CommunityError, type FeedPost, type Me } from '@/services/community';
import { space } from '@/theme';

function CommunityProfileScreen() {
  const t = useT();
  const [state, reload] = useCommunityMe();
  const [left, setLeft] = useState(false);

  if (left) return <Screen edges={['bottom']}><Text>{t.community.profile.left}</Text></Screen>;
  if (state.status === 'error') return <Screen edges={['bottom']}><ErrorPanel error={state.error} onRetry={reload} /></Screen>;
  if (state.status === 'join') return <Screen edges={['bottom']}><JoinCommunity onJoined={reload} /></Screen>;
  if (state.status === 'loading') return <Screen edges={['bottom']}><Text tone="soft">{t.common.loading}</Text></Screen>;
  // Keyed so the form starts again from the saved values whenever they change on the server.
  return <ProfileForm key={`${state.me.nickname}-${state.me.notify_support}-${state.me.notify_replies}`} me={state.me} onLeft={() => setLeft(true)} />;
}

function ProfileForm({ me, onLeft }: { me: Me; onLeft: () => void }) {
  const t = useT();
  const router = useRouter();
  const [nickname, setNickname] = useState(me.nickname);
  const [notifySupport, setNotifySupport] = useState(me.notify_support);
  const [notifyReplies, setNotifyReplies] = useState(me.notify_replies);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<CommunityError>();
  const [list, setList] = useState<'mine' | 'saved'>();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [blocked, setBlocked] = useState(0);

  useFocusEffect(
    useCallback(() => {
      community.blockedCount().then((r) => r.ok && setBlocked(r.data));
    }, []),
  );

  const showList = async (which: 'mine' | 'saved') => {
    setList(which);
    const r = await community.feed(which === 'mine' ? { mineOnly: true, limit: 50 } : { savedOnly: true, limit: 50 });
    if (r.ok) setPosts(r.data);
    else setError(r.error);
  };

  const save = async () => {
    const r = await community.setProfile(nickname, notifySupport, notifyReplies);
    if (!r.ok) return setError(r.error);
    setError(undefined);
    setSaved(true);
  };
  const changed = () => setSaved(false);

  return (
    <Screen edges={['bottom']}>
      <Field
        label={t.community.profile.nickname}
        value={nickname}
        onChangeText={(v) => {
          setNickname(v);
          changed();
        }}
        maxLength={24}
        autoCapitalize="none"
      />
      <Text variant="bodyStrong">{t.community.profile.notifications}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        <Chip
          label={t.community.profile.notifySupport}
          selected={notifySupport}
          onPress={() => {
            setNotifySupport(!notifySupport);
            changed();
          }}
        />
        <Chip
          label={t.community.profile.notifyReplies}
          selected={notifyReplies}
          onPress={() => {
            setNotifyReplies(!notifyReplies);
            changed();
          }}
        />
      </View>
      <Text variant="small" tone="soft">
        {t.community.profile.pushNote}
      </Text>
      {error ? <ErrorPanel error={error} /> : null}
      <Button label={saved ? t.community.profile.saved : t.community.profile.save} disabled={saved} onPress={save} />

      <View>
        <Row icon="note" title={t.community.profile.myPosts} onPress={() => showList('mine')} />
        <Row icon="bookmark" title={t.community.profile.savedPosts} onPress={() => showList('saved')} />
        {me.role === 'moderator' ? <Row icon="shield" title={t.community.profile.moderation} onPress={() => router.push('/community/moderation')} /> : null}
      </View>
      {list
        ? posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onChange={(next) => setPosts((all) => all.map((x) => (x.id === next.id ? next : x)))}
              onOpen={() => router.push({ pathname: '/community/[id]', params: { id: String(post.id) } })}
            />
          ))
        : null}

      <Panel>
        <Text>{t.community.profile.blocked(blocked)}</Text>
        {blocked ? (
          <Button
            kind="secondary"
            label={t.community.profile.unblockAll}
            onPress={async () => {
              const r = await community.unblockAll();
              if (r.ok) setBlocked(0);
            }}
          />
        ) : null}
        <ConfirmButton
          label={t.community.profile.leave}
          confirmLabel={t.community.profile.leaveConfirm}
          onConfirm={async () => {
            const r = await community.deleteMyData();
            if (r.ok) onLeft();
            else setError(r.error);
          }}
        />
      </Panel>
    </Screen>
  );
}

/** Left out of the test release (see src/config/features.ts): back to Today. */
export default function CommunityProfile() {
  return FEATURES.community ? <CommunityProfileScreen /> : <Redirect href="/" />;
}
