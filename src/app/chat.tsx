import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FEATURES } from '@/config/features';
import { IconButton } from '@/components/icon-button';
import { SafetyCard } from '@/components/safety-card';
import { Button, Chip, Panel, Text } from '@/components/ui';
import { CHAT_LIMITS, type ChatContext, type ChatTurn } from '@/domain/chat';
import { detectCrisis, type SafetyKind } from '@/domain/safety';
import { cravingsBeaten, smokeFreeSince, topTriggers } from '@/domain/stats';
import { HOUR } from '@/domain/time';
import { useIsRTL, useLang, useT } from '@/i18n';
import { recordSmoke } from '@/services/actions';
import { sendChat, type ClientErrorCode } from '@/services/chat-client';
import { useAppStore } from '@/store/app-store';
import { useSosSession } from '@/store/sos-session';
import { MAX_WIDTH, radius, space, type, usePalette } from '@/theme';

type Message =
  | { id: number; role: 'user' | 'assistant'; text: string }
  | { id: number; role: 'safety'; kind: SafetyKind }
  | { id: number; role: 'error'; code: ClientErrorCode };

/** Minimal, coarse context. No free text, nothing identifying (see ChatContext). */
function buildContext(): ChatContext | undefined {
  const { profile, smokes, cravings } = useAppStore.getState();
  if (!profile) return undefined;
  const now = Date.now();
  return {
    mode: profile.mode,
    smokeFreeHours: Math.min(90 * 24, Math.floor((now - smokeFreeSince(smokes, profile)) / HOUR)),
    cigsPerDay: profile.cigsPerDay,
    topTriggers: topTriggers(smokes, cravings, now).slice(0, 3).map((x) => x.trigger),
    cravingsBeaten: cravingsBeaten(cravings),
  };
}

function ChatScreen() {
  const consent = useAppStore((s) => s.aiConsent);
  return consent ? <Conversation /> : <Consent />;
}

function Consent() {
  const t = useT();
  const router = useRouter();
  const p = usePalette();
  const rtl = useIsRTL();
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: p.air, direction: rtl ? 'rtl' : 'ltr' }}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text variant="title" accessibilityRole="header">
          {t.chat.consentTitle}
        </Text>
        {t.chat.consentPoints.map((point) => (
          <View key={point} style={{ flexDirection: 'row', gap: space.sm }}>
            <Text tone="lung" accessibilityElementsHidden importantForAccessibility="no">
              •
            </Text>
            <Text style={{ flex: 1 }}>{point}</Text>
          </View>
        ))}
        <Text variant="small" tone="soft">
          {t.chat.notDoctor}
        </Text>
        <Button big label={t.chat.consentAccept} onPress={() => useAppStore.getState().setAiConsent(true)} />
        <Button kind="secondary" label={t.chat.consentDecline} onPress={() => router.navigate('/sos')} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Conversation() {
  const t = useT();
  const lang = useLang();
  const rtl = useIsRTL();
  const p = usePalette();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const nextId = useRef(1);
  const busyRef = useRef(false);
  const abortRef = useRef<AbortController>(undefined);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const history = (list: Message[]): ChatTurn[] =>
    list.filter((m): m is Extract<Message, { role: 'user' | 'assistant' }> => (m.role === 'user' || m.role === 'assistant') && !!m.text)
      .map((m) => ({ role: m.role, text: m.text }));

  const ask = async (base: Message[]) => {
    // One request at a time: no double sends from repeated taps.
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const replyId = nextId.current++;
    setMessages([...base, { id: replyId, role: 'assistant', text: '' }]);

    const abort = new AbortController();
    abortRef.current = abort;
    await sendChat(
      { lang, messages: history(base), context: buildContext() },
      {
        installId: useAppStore.getState().getInstallId(),
        signal: abort.signal,
        onEvent: (event) => {
          if (event.t === 'delta') {
            setMessages((list) => list.map((m) => (m.id === replyId && m.role === 'assistant' ? { ...m, text: m.text + event.text } : m)));
          } else if (event.t === 'safety') {
            setMessages((list) => [...list.filter((m) => m.id !== replyId), { id: nextId.current++, role: 'safety', kind: event.kind }]);
          } else if (event.t === 'error') {
            setMessages((list) => {
              // A refusal replaces any partial text; other errors keep what already arrived.
              const kept = list.filter((m) => m.id !== replyId || (event.code !== 'refused' && m.role === 'assistant' && m.text));
              return [...kept, { id: nextId.current++, role: 'error', code: event.code }];
            });
          }
        },
      },
    );
    setMessages((list) => list.filter((m) => !(m.id === replyId && m.role === 'assistant' && !m.text)));
    busyRef.current = false;
    setBusy(false);
  };

  const send = (raw: string) => {
    const text = raw.trim().slice(0, CHAT_LIMITS.maxMessageChars);
    if (!text || busyRef.current) return;
    setInput('');
    const withUser: Message[] = [...messages.filter((m) => m.role !== 'error'), { id: nextId.current++, role: 'user', text }];
    // Crisis words: answer on the phone right away, no network needed, nothing sent to the AI.
    const crisis = detectCrisis(text);
    if (crisis) {
      setMessages([...withUser, { id: nextId.current++, role: 'safety', kind: crisis }]);
      return;
    }
    ask(withUser);
  };

  // Back from urge surfing started here: tell the companion how it went, once.
  useFocusEffect(
    useCallback(() => {
      const result = useSosSession.getState().takeSurfResult();
      if (result) send(t.chatSurf.report(result.before, result.after, result.helped));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const startSurf = () => router.push({ pathname: '/urge-surf', params: { from: 'chat' } });
  const toCommunity = () => router.push({ pathname: '/community/new', params: { type: 'craving' } });

  const retry = () => {
    const base = messages.filter((m) => m.role !== 'error');
    if (base.at(-1)?.role === 'user') ask(base);
  };

  const record = async (beaten: boolean) => {
    useAppStore.getState().logCraving(beaten, 'chat');
    setRecorded(true);
    if (!beaten) {
      const event = await recordSmoke();
      if (useAppStore.getState().profile?.mode === 'quit') router.push({ pathname: '/slip', params: { smoke: event.id } });
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setRecorded(false);
  };

  const last = messages.at(-1);
  const hasReply = messages.some((m) => m.role === 'assistant' && m.text);
  // The reply placeholder is empty until the first words stream in.
  const showTyping = busy && last?.role === 'assistant' && !last.text;

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: p.air, direction: rtl ? 'rtl' : 'ltr' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.page}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          <Text variant="small" tone="soft">
            {t.chat.notDoctor}
          </Text>

          {messages.length === 0 ? (
            <View style={{ gap: space.md }}>
              <Text variant="heading">{t.chat.emptyTitle}</Text>
              <View style={styles.chips}>
                {t.chat.quick.map((q) => (
                  <Chip key={q} label={q} onPress={() => send(q)} />
                ))}
              </View>
              <Button kind="secondary" label={`🌊 ${t.chatSurf.button}`} onPress={startSurf} />
              <Button kind="secondary" label={t.chat.community} onPress={toCommunity} />
            </View>
          ) : null}

          {messages.map((m) => {
            if (m.role === 'safety') return <SafetyCard key={m.id} kind={m.kind} />;
            if (m.role === 'error') {
              return (
                <Panel key={m.id} tone="sky">
                  <Text accessibilityLiveRegion="polite">{t.chat.errors[m.code === 'network' ? 'network' : m.code]}</Text>
                  <View style={styles.chips}>
                    {m.code !== 'not_configured' && m.code !== 'rate_limited' && m.code !== 'bad_request' ? (
                      <Button label={t.chat.retry} onPress={retry} />
                    ) : null}
                    <Button kind="secondary" label={t.chat.offlineTools} onPress={() => router.navigate('/sos')} />
                  </View>
                </Panel>
              );
            }
            if (m.role === 'assistant' && !m.text) return null;
            const mine = m.role === 'user';
            return (
              <View
                key={m.id}
                accessible
                accessibilityLabel={`${mine ? t.chat.you : t.chat.companion}: ${m.text}`}
                style={[
                  styles.bubble,
                  mine
                    ? { alignSelf: 'flex-end', backgroundColor: p.lung }
                    : { alignSelf: 'flex-start', backgroundColor: p.surface, borderColor: p.line, borderWidth: 1 },
                ]}>
                <Text tone={mine ? 'onLung' : 'ink'}>{m.text}</Text>
              </View>
            );
          })}

          {showTyping ? (
            <View style={[styles.bubble, { alignSelf: 'flex-start', backgroundColor: p.surface }]} accessibilityLiveRegion="polite">
              <Text tone="soft">{t.chat.typing}</Text>
            </View>
          ) : null}

          {hasReply && !busy ? (
            <View style={styles.chips}>
              <Button kind="secondary" label={`🌊 ${t.chatSurf.button}`} onPress={startSurf} />
              <Button kind="secondary" label={t.chat.community} onPress={toCommunity} />
            </View>
          ) : null}

          {hasReply && !busy ? (
            <Panel>
              <Text variant="bodyStrong">{recorded ? t.chat.recorded : t.chat.howNow}</Text>
              {!recorded ? (
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  <Button style={{ flex: 1 }} label={t.sos.passed} onPress={() => record(true)} />
                  <Button style={{ flex: 1 }} kind="secondary" label={t.sos.smoked} onPress={() => record(false)} />
                </View>
              ) : null}
            </Panel>
          ) : null}
        </ScrollView>

        <View style={[styles.composer, { borderTopColor: p.line, backgroundColor: p.surface }]}>
          {messages.length > 0 && !busy ? (
            <IconButton icon="restart" label={t.chat.newChat} onPress={reset} />
          ) : null}
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t.chat.placeholder}
            placeholderTextColor={p.inkSoft}
            accessibilityLabel={t.chat.placeholder}
            maxLength={CHAT_LIMITS.maxMessageChars}
            multiline
            onSubmitEditing={() => send(input)}
            blurOnSubmit={false}
            style={[
              type.body,
              styles.input,
              { color: p.ink, backgroundColor: p.air, borderColor: p.control, textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' },
            ]}
          />
          <IconButton icon="send" variant="filled" mirrorInRtl label={t.chat.send} disabled={busy || !input.trim()} onPress={() => send(input)} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { padding: space.md, gap: space.md, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', flexGrow: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  bubble: { maxWidth: '85%', borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.sm2 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    padding: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
    maxWidth: MAX_WIDTH + 2 * space.md,
    alignSelf: 'center',
  },
  input: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.sm, minHeight: 44, maxHeight: 120 },
});

/** Left out of the test release (see src/config/features.ts): back to Today. */
export default function Chat() {
  return FEATURES.chat ? <ChatScreen /> : <Redirect href="/" />;
}
