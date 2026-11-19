import * as Linking from 'expo-linking';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { FEATURES } from '@/config/features';
import { Icon } from '@/components/icons';
import { Button, Panel, Row, Screen, Text } from '@/components/ui';
import { useT } from '@/i18n';
import { useAppStore } from '@/store/app-store';
import { ARTICLES, isArticleId, siteName, SOURCES } from '@/i18n/articles';
import { radius, space, usePalette } from '@/theme';

/** Articles whose advice is something the user can do right now. */
const ACTIONABLE = new Set(['cravings', 'withdrawal', 'slips']);

const open = (url: string) => {
  WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url).catch(() => undefined));
};

function ArticleScreenScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const p = usePalette();
  const read = useAppStore((s) => s.lessons.some((l) => l.id === id));

  // The id comes from the URL, so it is untrusted: unknown ids get a friendly dead end.
  if (!isArticleId(id)) {
    return (
      <Screen edges={['bottom']}>
        <Text variant="heading">{t.notFound.title}</Text>
        <Button label={t.learn.title} onPress={() => router.replace('/learn')} />
      </Screen>
    );
  }

  const meta = ARTICLES[id];
  const article = t.learn.articles[id];

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: t.learn.categoriesShort[meta.category] }} />
      <View style={[styles.badge, { backgroundColor: p.lungSoft }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Icon name={meta.icon} color={p.lung} size={32} />
      </View>
      <Text variant="title" accessibilityRole="header">
        {article.title}
      </Text>
      <Text variant="bodyStrong" tone="soft">
        {article.summary}
      </Text>

      {article.sections.map((section, i) => (
        <Panel key={i}>
          {section.heading ? (
            <Text variant="heading" accessibilityRole="header">
              {section.heading}
            </Text>
          ) : null}
          {section.points.map((point) => (
            <View key={point} style={{ flexDirection: 'row', gap: space.sm }}>
              <Text tone="lung" accessibilityElementsHidden importantForAccessibility="no">
                •
              </Text>
              <Text style={{ flex: 1 }}>{point}</Text>
            </View>
          ))}
        </Panel>
      ))}

      {ACTIONABLE.has(id) ? (
        <Panel tone="sky">
          <Text variant="bodyStrong">{t.learn.related}</Text>
          <Button label={t.learn.openSos} onPress={() => router.navigate('/sos')} />
        </Panel>
      ) : null}

      <View>
        <Text variant="small" tone="soft">
          {t.learn.sources}
        </Text>
        {meta.sources.map((sourceId) => {
          const url = SOURCES[sourceId].url;
          return (
            <Row
              key={sourceId}
              title={t.learn.sourceNames[sourceId]}
              // The site, not the full address: a 66-character path wraps mid-word and is read out letter by letter.
              subtitle={url ? siteName(url) : undefined}
              accessibilityHint={url ? t.help.open : undefined}
              onPress={url ? () => open(url) : undefined}
            />
          );
        })}
      </View>

      {read ? (
        <View style={{ alignItems: 'center', gap: space.xs }}>
          <Text variant="bodyStrong" tone="lung" style={{ textAlign: 'center' }}>
            ✓ {t.learn.read}
          </Text>
          <Button kind="quiet" label={t.learn.markUnread} onPress={() => useAppStore.getState().unmarkLessonRead(id)} />
        </View>
      ) : (
        <Button kind="secondary" label={t.learn.markRead} onPress={() => useAppStore.getState().markLessonRead(id)} />
      )}

      <Text variant="small" tone="soft">
        {t.learn.disclaimer}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: { width: 64, height: 64, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});

/** Hidden for the test release (see src/config/features.ts): back to Today. */
export default function ArticleScreen() {
  return FEATURES.learn ? <ArticleScreenScreen /> : <Redirect href="/" />;
}
