import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { FEATURES } from '@/config/features';
import { useT } from '@/i18n';
import { usePalette } from '@/theme';

/** Native bottom tabs on iOS and Android. The web variant lives in app-tabs.web.tsx. */
export default function AppTabs() {
  const p = usePalette();
  const t = useT();
  return (
    <NativeTabs
      backgroundColor={p.surface}
      indicatorColor={p.lungSoft}
      iconColor={{ default: p.inkSoft, selected: p.lung }}
      labelStyle={{ default: { color: p.inkSoft }, selected: { color: p.lung } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t.tabs.today}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="timer" md="timer" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sos">
        <NativeTabs.Trigger.Label>{t.tabs.sos}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="lifepreserver" md="sos" />
      </NativeTabs.Trigger>
      {/* Fixed per build (src/config/features.ts), so the navigator never remounts. */}
      <NativeTabs.Trigger name="community" hidden={!FEATURES.community}>
        <NativeTabs.Trigger.Label>{t.tabs.community}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.3" md="groups" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="progress">
        <NativeTabs.Trigger.Label>{t.tabs.progress}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar" md="insights" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="learn" hidden={!FEATURES.learn}>
        <NativeTabs.Trigger.Label>{t.tabs.learn}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="book" md="menu_book" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
