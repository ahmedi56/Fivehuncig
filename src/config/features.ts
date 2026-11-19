/**
 * Online features left out of the first test release: the AI chat costs money per message and
 * needs a server, and the Community needs a moderator. Their code stays for later.
 *
 * On in development, so they can still be worked on. Off in release builds unless the build sets
 * EXPO_PUBLIC_FEATURE_CHAT=1 or EXPO_PUBLIC_FEATURE_COMMUNITY=1 (and =0 turns one off in development).
 * When off, every entry point is hidden and the screens send anyone who reaches them back to Today.
 */
export function featureOn(value: string | undefined, dev: boolean): boolean {
  return value === undefined || value === '' ? dev : value === '1';
}

// Written out in full so Expo inlines the values at build time.
export const FEATURES = {
  chat: featureOn(process.env.EXPO_PUBLIC_FEATURE_CHAT, __DEV__),
  community: featureOn(process.env.EXPO_PUBLIC_FEATURE_COMMUNITY, __DEV__),
  // Hidden for the test release so the app stays simple (council, Oct 2026): the puzzle games, guided
  // imagery and weekly challenges; and the Learn articles until a health professional has reviewed
  // them. Off everywhere, development too, unless EXPO_PUBLIC_FEATURE_EXTRAS=1 / EXPO_PUBLIC_FEATURE_LEARN=1.
  extras: featureOn(process.env.EXPO_PUBLIC_FEATURE_EXTRAS, false),
  learn: featureOn(process.env.EXPO_PUBLIC_FEATURE_LEARN, false),
} as const;
