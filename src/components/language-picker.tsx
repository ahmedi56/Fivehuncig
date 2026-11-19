import { View } from 'react-native';

import { LANGUAGES, useLang } from '@/i18n';
import { useAppStore } from '@/store/app-store';
import { space } from '@/theme';

import { Chip } from './ui';

/** English / Français / العربية — each label in its own language so anyone can find theirs. */
export function LanguagePicker({ centered }: { centered?: boolean } = {}) {
  const lang = useLang();
  return (
    <View
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: centered ? 'center' : 'flex-start' }}
      accessibilityRole="radiogroup">
      {LANGUAGES.map((l) => (
        <Chip role="radio"
          key={l.lang}
          label={l.name}
          selected={lang === l.lang}
          onPress={() => useAppStore.getState().setLanguage(l.lang)}
        />
      ))}
    </View>
  );
}
