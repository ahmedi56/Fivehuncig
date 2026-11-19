import { Share, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { LANGUAGES, messagesFor, useLang, useT } from '@/i18n';
import type { Lang } from '@/i18n/plural';
import { useAppStore } from '@/store/app-store';
import { radius, space, usePalette } from '@/theme';

import { Button, Chip, Panel, Text } from './ui';

/**
 * Words to show (or send) to a pharmacist: the member's own cigarettes a day and the questions to
 * ask. It names no prescription drug and gives no dose: the pharmacist decides. Its language can
 * differ from the app's, to match the pharmacist.
 */
export function PharmacistScript() {
  const t = useT();
  const p = usePalette();
  const appLang = useLang();
  const [lang, setLang] = useState<Lang>(appLang);
  const cigs = useAppStore((s) => s.profile?.cigsPerDay ?? 10);
  const script = messagesFor(lang).help.pharmacist.script(cigs);
  return (
    <Panel>
      <Text variant="heading">{t.help.pharmacist.title}</Text>
      <Text variant="small" tone="soft">
        {t.help.pharmacist.language}
      </Text>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {LANGUAGES.map((x) => (
          <Chip role="radio" key={x.lang} label={x.name} selected={lang === x.lang} onPress={() => setLang(x.lang)} />
        ))}
      </View>
      <View style={[styles.script, { backgroundColor: p.surfaceAlt }]}>
        <Text followContent style={styles.scriptText}>
          {script}
        </Text>
      </View>
      <Text variant="small" tone="soft">
        {t.help.pharmacist.note}
      </Text>
      <Button kind="secondary" label={t.help.pharmacist.share} onPress={() => Share.share({ message: script }).catch(() => undefined)} />
    </Panel>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  script: { borderRadius: radius.md, padding: space.md },
  // Large enough to show across a pharmacy counter.
  scriptText: { fontSize: 18, lineHeight: 28 },
});
