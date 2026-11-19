import type { ReactNode } from 'react';

/** iOS and Android move accessibility focus between screens themselves. See screen-focus.web.tsx. */
export function ScreenFocus({ children }: { navigation: { isFocused: () => boolean }; children: ReactNode }) {
  return <>{children}</>;
}
