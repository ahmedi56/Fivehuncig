import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { FEATURES } from '@/config/features';
import { CharsLeft, ErrorPanel, JoinCommunity, useCommunityMe } from '@/components/community';
import { SafetyCard } from '@/components/safety-card';
import { Button, Chip, Screen, Text } from '@/components/ui';
import { detectCrisis } from '@/domain/safety';
import { useIsRTL, useLang, useT } from '@/i18n';
import { community, POST_TYPES, ROOM_FOR, ROOMS, type CommunityError, type PostType, type Room } from '@/services/community';
import { radius, space, type, usePalette } from '@/theme';

/** Types offered as one-tap choices (the daily question and challenge come from their own buttons). */
const QUICK: PostType[] = ['craving', 'difficult_day', 'milestone', 'motivation', 'general'];

function NewPostScreen() {
  const t = useT();
  const lang = useLang();
  const rtl = useIsRTL();
  const p = usePalette();
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; question?: string }>();
  const initialType = POST_TYPES.includes(params.type as PostType) ? (params.type as PostType) : undefined;
  // The question text comes from a link: only accept one of today's real questions.
  const question = t.community.questions.includes(params.question ?? '') ? params.question : undefined;

  const [state, reload] = useCommunityMe();
  const [postType, setPostType] = useState<PostType | undefined>(initialType);
  const [room, setRoom] = useState<Room>(initialType ? ROOM_FOR[initialType] : 'starting');
  const [body, setBody] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<CommunityError>();
  const [crisisAcknowledged, setCrisisAcknowledged] = useState(false);
  const crisis = detectCrisis(body);

  const choose = (next: PostType) => {
    setPostType(next);
    setRoom(ROOM_FOR[next]);
  };

  const submit = async () => {
    if (!postType || busy) return;
    if (crisis && !crisisAcknowledged) return;
    setBusy(true);
    const text = question ? `«${question}»\n${body.trim()}` : body;
    const r = await community.createPost({ room, type: postType, body: text, lang, anonymous, concern: !!crisis });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    router.replace({ pathname: '/community/[id]', params: { id: String(r.data) } });
  };

  if (state.status === 'error') return <Screen edges={['bottom']}><ErrorPanel error={state.error} onRetry={reload} /></Screen>;
  if (state.status === 'join') return <Screen edges={['bottom']}><JoinCommunity onJoined={reload} /></Screen>;
  if (state.status === 'loading') return <Screen edges={['bottom']}><Text tone="soft">{t.common.loading}</Text></Screen>;

  return (
    <Screen edges={['bottom']}>
      <Text variant="title" accessibilityRole="header">
        {question ?? t.community.composer.title}
      </Text>

      {!question ? (
        <View style={styles.chips} accessibilityRole="radiogroup">
          {QUICK.map((k) => (
            <Chip role="radio" key={k} label={t.community.types[k]} selected={postType === k} onPress={() => choose(k)} />
          ))}
        </View>
      ) : null}

      {postType === 'difficult_day' ? <Text tone="lung">{t.community.setbackNote}</Text> : null}

      <TextInput
        value={body}
        onChangeText={(v) => {
          setBody(v);
          setCrisisAcknowledged(false);
        }}
        placeholder={t.community.composer.placeholder}
        placeholderTextColor={p.inkSoft}
        accessibilityLabel={question ?? t.community.composer.title}
        multiline
        maxLength={900}
        style={[
          type.body,
          styles.input,
          { color: p.ink, backgroundColor: p.surface, borderColor: p.control, textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' },
        ]}
      />
      <CharsLeft value={body} max={900} />
      <Text variant="small" tone="soft">
        {t.community.peerNote}
      </Text>

      {crisis ? <SafetyCard kind={crisis} /> : null}

      <Text variant="bodyStrong">{t.community.composer.room}</Text>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {ROOMS.map((r) => (
          <Chip role="radio" key={r} label={t.community.rooms[r]} selected={room === r} onPress={() => setRoom(r)} />
        ))}
      </View>

      <Text variant="bodyStrong">{t.community.composer.postAs}</Text>
      <View style={styles.chips} accessibilityRole="radiogroup">
        <Chip role="radio" label={t.community.composer.anonymously} selected={anonymous} onPress={() => setAnonymous(true)} />
        {state.status === 'ready' ? (
          <Chip role="radio" label={t.community.composer.withNickname(state.me.nickname)} selected={!anonymous} onPress={() => setAnonymous(false)} />
        ) : null}
      </View>

      {error ? <ErrorPanel error={error} /> : null}

      {crisis && !crisisAcknowledged ? (
        <Button kind="secondary" label={t.community.composer.crisisPost} onPress={() => setCrisisAcknowledged(true)} />
      ) : (
        <Button
          big
          label={t.community.composer.post}
          loading={busy}
          disabled={!postType || !body.trim()}
          onPress={submit}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  input: { borderWidth: 1, borderRadius: radius.sm, padding: space.md, minHeight: 120, textAlignVertical: 'top' },
});

/** Left out of the test release (see src/config/features.ts): back to Today. */
export default function NewPost() {
  return FEATURES.community ? <NewPostScreen /> : <Redirect href="/" />;
}
