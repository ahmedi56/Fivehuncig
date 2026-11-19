import { View } from 'react-native';

import { PharmacistScript } from '@/components/pharmacist-script';
import { SupportList } from '@/components/support-list';
import { Chip, Panel, Row, Screen, Text } from '@/components/ui';
import { useLang, useT } from '@/i18n';
import { SUPPORT } from '@/resources/support';
import { useAppStore } from '@/store/app-store';
import { space } from '@/theme';

export default function Help() {
  const t = useT();
  const lang = useLang();
  const chosen = useAppStore((s) => s.country);

  return (
    <Screen edges={['bottom']}>
      <Panel tone="lung">
        <Text variant="heading">{t.help.medsTitle}</Text>
        <Text>{t.help.medsBody}</Text>
      </Panel>

      <PharmacistScript />

      <Text variant="heading">{t.help.talk}</Text>
      <Row icon="medical" title={t.help.doctor.title} subtitle={t.help.doctor.subtitle} />

      <View style={{ gap: space.sm }}>
        <Text variant="bodyStrong">{t.help.country}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }} accessibilityRole="radiogroup">
          <Chip role="radio" label={t.help.phoneRegion} selected={!chosen} onPress={() => useAppStore.getState().setCountry(undefined)} />
          {SUPPORT.map((c) => (
            <Chip role="radio"
              key={c.country}
              label={c.names[lang]}
              selected={chosen === c.country}
              onPress={() => useAppStore.getState().setCountry(c.country)}
            />
          ))}
        </View>
      </View>
      <SupportList kinds={['quitline', 'crisis', 'urgent']} />

      <Panel>
        <Text variant="heading">{t.help.seeDoctorTitle}</Text>
        <Text variant="bodyStrong">{t.help.seeDoctorNow}</Text>
        <View style={{ gap: space.xs }}>
          {t.help.seeDoctorWhen.map((line) => (
            <Text key={line}>• {line}</Text>
          ))}
        </View>
      </Panel>

      <Panel tone="ember">
        <Text variant="bodyStrong">{t.help.lowTitle}</Text>
        <Text>{t.help.lowBody}</Text>
      </Panel>

      <Text variant="small" tone="soft">
        {t.app.notMedicalAdvice}
      </Text>
    </Screen>
  );
}
