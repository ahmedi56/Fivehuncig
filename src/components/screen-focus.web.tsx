import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { View } from 'react-native';

type Nav = { isFocused: () => boolean };

// The first screen of a page load keeps the browser's normal focus; later screens take it over.
let shownBefore = false;

/**
 * Web-only focus management for stack screens (the native file is a pass-through).
 *
 * The stack hides a covered screen with aria-hidden + display:none in the same render as the
 * navigation. The control that opened the next screen still has focus at that moment, so the
 * browser refuses the aria-hidden ("Blocked aria-hidden ... descendant retained focus") and
 * keyboard focus ends up nowhere. Layout effects run before the browser processes that change:
 * - covered: blur the focused control inside, and remember it;
 * - shown again (back): give focus back to that control;
 * - newly opened: focus the screen itself, so Tab and screen readers start there.
 */
export function ScreenFocus({ navigation, children }: { navigation: Nav; children: ReactNode }) {
  const ref = useRef<View>(null);
  const wasFocused = useRef<boolean | undefined>(undefined);
  const opener = useRef<HTMLElement | null>(null);

  // No dependency list on purpose: focus changes arrive through the navigator's re-render.
  useLayoutEffect(() => {
    const focused = navigation.isFocused();
    const before = wasFocused.current;
    wasFocused.current = focused;
    if (before === focused) return;
    const node = ref.current as unknown as HTMLElement | null;
    if (!node) return;

    if (!focused) {
      const active = document.activeElement as HTMLElement | null;
      if (active && node.contains(active)) {
        opener.current = active;
        active.blur();
      }
      return;
    }

    const nothingFocused = !document.activeElement || document.activeElement === document.body;
    if (before === false) {
      const back = opener.current;
      opener.current = null;
      if (back?.isConnected && nothingFocused) back.focus({ preventScroll: true });
    } else if (shownBefore && nothingFocused) {
      node.focus({ preventScroll: true });
    }
    shownBefore = true;
  });

  return (
    <View ref={ref} tabIndex={-1} style={{ flex: 1, outlineStyle: 'none' } as object}>
      {children}
    </View>
  );
}
