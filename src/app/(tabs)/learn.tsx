import { Redirect, useRouter } from 'expo-router';
import { View } from 'react-native';

import { FEATURES } from '@/config/features';
import { Row, Screen, Text } from '@/components/ui';
import { useT } from '@/i18n';
import { ARTICLE_IDS, ARTICLES, CATEGORY_ORDER } from '@/i18n/articles';
import { useAppStore } from '@/store/app-store';

function LearnScreen() {
  const router = useRouter();
  const t = useT();
  const lessons = useAppStore((s) => s.lessons);
  const read = new Set(lessons.map((l) => l.id));

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">
        {t.learn.title}
      </Text>
      <Text tone="soft">{t.learn.intro}</Text>

      {CATEGORY_ORDER.map((category) => (
        <View key={category}>
          <Text variant="heading" accessibilityRole="header">
            {t.learn.categories[category]}
          </Text>
          <Text variant="small" tone="soft">
            {t.learn.categoryIntro[category]}
          </Text>
          {ARTICLE_IDS.filter((id) => ARTICLES[id].category === category).map((id) => {
            const article = t.learn.articles[id];
            const done = read.has(id);
            return (
              <Row
                key={id}
                icon={ARTICLES[id].icon}
                title={article.title}
                subtitle={article.summary}
                // Read articles carry a check, so returning members can see what's new.
                right={
                  done ? (
                    <Text variant="small" tone="lung" aria-hidden>
                      ✓
                    </Text>
                  ) : undefined
                }
                accessibilityLabel={done ? `${article.title}. ${article.summary.replace(/\.\s*$/, '')}. ${t.learn.read}` : undefined}
                onPress={() => router.push({ pathname: '/learn/[id]', params: { id } })}
              />
            );
          })}
        </View>
      ))}

      <Row icon="progress" title={t.learn.progressLink} onPress={() => router.navigate('/progress')} />

      <Text variant="small" tone="soft">
        {t.learn.disclaimer}
      </Text>
    </Screen>
  );
}

/** Hidden for the test release (see src/config/features.ts): back to Today. */
export default function Learn() {
  return FEATURES.learn ? <LearnScreen /> : <Redirect href="/" />;
}
