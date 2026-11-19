import { DarkTheme, DefaultTheme, ThemeProvider, useRouter, type Href } from 'expo-router';
import { HeaderBackButton } from 'expo-router/react-navigation';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { ScreenFocus } from '@/components/screen-focus';
import { Loading } from '@/components/ui';
import { isRTL, useLang, useT } from '@/i18n';
import { syncReminder } from '@/services/actions';
import { BREATHE_URL, configureNotifications, onNotificationOpen } from '@/services/notifications';
import { useAppStore, useHydrated } from '@/store/app-store';
import { usePalette } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

// Loaded only in development, so the toggle and its fixtures never reach a production bundle.
const DevToggle: () => React.JSX.Element | null = __DEV__
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- dev-only, stripped from production
  ? (require('@/dev/data-toggle') as typeof import('@/dev/data-toggle')).DevDataToggle
  : () => null;

// A deep link (a reload on web, a shared link, a notification) to a screen like /learn/cigars
// opens it with the tabs underneath, so there is always a back button. Applies to deep links only.
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const hydrated = useHydrated();
  const onboarded = useAppStore((s) => !!s.profile);
  const scheme = useColorScheme();
  const p = usePalette();
  const lang = useLang();
  const t = useT();

  useEffect(() => {
    configureNotifications(t.notifications.channel, t.notifications.breatheAction);
  }, [t]);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => undefined);
  }, [hydrated]);

  // Once per start: the one daily reminder in the current language (and pre-v3 per-plan reminders cancelled).
  useEffect(() => {
    if (hydrated && onboarded) syncReminder().catch(() => undefined);
  }, [hydrated, onboarded]);

  // A tapped notification opens its screen. Its address is untrusted: only the follow-up
  // question is accepted, and that screen checks the id itself.
  const router = useRouter();
  useEffect(() => {
    if (!hydrated || !onboarded) return;
    return onNotificationOpen((url) => {
      if (/^\/follow-up\?id=[\w-]+$/.test(url) || url === BREATHE_URL) router.push(url as Href);
    });
  }, [hydrated, onboarded, router]);

  // Screen readers and the browser's text shaping use the document language and direction.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
  }, [lang]);

  if (!hydrated) return <Loading />;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: { ...base.colors, background: p.air, card: p.air, text: p.ink, primary: p.lung, border: p.line },
  };

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: p.lung,
          // The web header names the back button after the previous route ("(tabs), back", in
          // English only). Native headers use the system's own localized label.
          ...(Platform.OS === 'web'
            ? {
                headerLeft: ({ canGoBack, label: _previous, ...props }) =>
                  canGoBack ? <HeaderBackButton {...props} accessibilityLabel={t.common.back} /> : undefined,
              }
            : null),
        }}
        screenLayout={({ navigation, children }) => <ScreenFocus navigation={navigation}>{children}</ScreenFocus>}>
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="chat" options={{ title: t.chat.title }} />
          <Stack.Screen name="more" options={{ title: t.screens.more }} />
          <Stack.Screen name="support" options={{ presentation: 'modal', title: t.screens.support }} />
          <Stack.Screen name="community/new" options={{ title: t.screens.newPost }} />
          <Stack.Screen name="community/[id]" options={{ title: t.screens.post }} />
          <Stack.Screen name="community/activity" options={{ title: t.screens.activity }} />
          <Stack.Screen name="community/profile" options={{ title: t.screens.communityProfile }} />
          <Stack.Screen name="community/moderation" options={{ title: t.screens.moderation }} />
          <Stack.Screen name="memories" options={{ title: t.screens.memories }} />
          <Stack.Screen name="breathe" options={{ title: t.screens.breathe }} />
          <Stack.Screen name="urge-surf" options={{ title: t.screens.urgeSurf }} />
          <Stack.Screen name="games/bubbles" options={{ title: t.screens.bubbles }} />
          <Stack.Screen name="games/memory" options={{ title: t.screens.memory }} />
          <Stack.Screen name="games/block-drop" options={{ title: t.screens.blocks }} />
          <Stack.Screen name="activities/move" options={{ title: t.screens.move }} />
          <Stack.Screen name="activities/squeeze" options={{ title: t.screens.squeeze }} />
          <Stack.Screen name="activities/imagery" options={{ title: t.screens.imagery }} />
          <Stack.Screen name="learn/[id]" options={{ title: t.screens.article }} />
          <Stack.Screen name="follow-up" options={{ title: t.screens.followUp }} />
          <Stack.Screen name="plans" options={{ title: t.screens.plans }} />
          <Stack.Screen name="reasons" options={{ title: t.screens.reasons }} />
          <Stack.Screen name="mode" options={{ title: t.screens.mode }} />
          <Stack.Screen name="help" options={{ title: t.screens.help }} />
          <Stack.Screen name="settings" options={{ title: t.screens.settings }} />
          <Stack.Screen name="tour" options={{ title: t.settings.tourTitle }} />
          <Stack.Screen name="slip" options={{ presentation: 'modal', title: t.screens.slip }} />
        </Stack.Protected>
        <Stack.Screen name="+not-found" options={{ title: t.screens.notFound }} />
      </Stack>
      {/* DEV ONLY (break-ui): Demo data / Worst case / Empty / One. Removed from production builds. */}
      {__DEV__ && Platform.OS === 'web' ? <DevToggle /> : null}
    </ThemeProvider>
  );
}
