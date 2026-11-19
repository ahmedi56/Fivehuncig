import { useT } from '@/i18n';

import { Text } from './ui';

/**
 * Appears once `showAt` or fewer characters remain, so typing never stops at a limit without warning.
 * Announced to screen readers only near the end (`warnAt` or fewer), not on every keystroke.
 */
export function CharsLeft({ value, max, showAt = 100, warnAt = 20 }: { value: string; max: number; showAt?: number; warnAt?: number }) {
  const t = useT();
  const left = max - value.length;
  if (left > showAt) return null;
  const close = left <= warnAt;
  return (
    <Text variant="small" tone={close ? 'ember' : 'soft'} aria-live={close ? 'polite' : undefined}>
      {t.community.charsLeft(left)}
    </Text>
  );
}
