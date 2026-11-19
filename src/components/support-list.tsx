import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { View } from 'react-native';

import { deviceRegion, useLang, useT } from '@/i18n';
import { supportFor, WORLDWIDE, type ResourceKind, type SupportResource } from '@/resources/support';
import { useAppStore } from '@/store/app-store';

import type { IconName } from './icons';
import { Row, Text } from './ui';

const open = (url: string) => {
  WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url).catch(() => undefined));
};
const call = (phone: string) => Linking.openURL(`tel:${phone}`).catch(() => undefined);

const ICON: Record<ResourceKind, IconName> = { quitline: 'phone', crisis: 'chat', urgent: 'medical' };

/** The member's country: their choice in Get help, else the phone's region. */
export function useSupportCountry(): string | undefined {
  const chosen = useAppStore((s) => s.country);
  return chosen ?? deviceRegion();
}

/**
 * Verified lines for the member's country (see src/resources/support.ts), filtered by kind.
 * Never shows an unverified number: unknown countries get a safe fallback message.
 */
export function SupportList({ kinds, showWorldwide = true }: { kinds: ResourceKind[]; showWorldwide?: boolean }) {
  const t = useT();
  const lang = useLang();
  const country = supportFor(useSupportCountry());
  const items = country?.resources.filter((r) => kinds.includes(r.kind)) ?? [];

  return (
    <View>
      {country ? (
        <Text variant="small" tone="soft">
          {country.names[lang]}
        </Text>
      ) : null}
      {/* Only claim "no verified lines" when we know nothing about the country. */}
      {!country ? <Text tone="soft">{t.safety.noLines}</Text> : null}
      {items.map((r) => (
        <ResourceRow key={r.name} resource={r} />
      ))}
      {showWorldwide ? <ResourceRow resource={WORLDWIDE} label={t.help.worldwide} /> : null}
    </View>
  );
}

function ResourceRow({ resource: r, label }: { resource: SupportResource; label?: string }) {
  const t = useT();
  const details = [
    t.help.kinds[r.kind],
    r.phoneLabel ? t.help.call(r.phoneLabel) : r.url ? t.help.open : undefined,
    r.note ? t.help.notes[r.note] : undefined,
    t.help.checked(r.verifiedAt),
  ]
    .filter(Boolean)
    .join(' · ');
  const phone = r.phone;
  const url = r.url;
  return (
    <Row
      icon={ICON[r.kind]}
      title={label ?? r.name}
      subtitle={details}
      onPress={phone ? () => call(phone) : url ? () => open(url) : undefined}
    />
  );
}
