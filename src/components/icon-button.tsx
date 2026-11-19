import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useIsRTL } from '@/i18n';
import { radius, state, usePalette } from '@/theme';

import { Icon, type IconName } from './icons';
import { pressedStyle, tap } from './ui';

/**
 * A 44×44 button showing only an icon. `label` is required: it is the only name screen readers get.
 * `children` render on top (e.g. an unread badge).
 */
export function IconButton({
  icon,
  label,
  onPress,
  variant = 'plain',
  disabled,
  mirrorInRtl,
  children,
  style,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  /** `plain`: green icon, no background. `filled`: white icon on a green circle (the screen's main action). */
  variant?: 'plain' | 'filled';
  disabled?: boolean;
  /** Flip horizontally in right-to-left languages (arrows that point "forward"). */
  mirrorInRtl?: boolean;
  children?: ReactNode;
  /** Layout overrides (margins, flex), merged last. */
  style?: StyleProp<ViewStyle>;
}) {
  const p = usePalette();
  const rtl = useIsRTL();
  const filled = variant === 'filled';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-disabled={!!disabled}
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        {
          width: 44,
          height: 44,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: filled ? p.lung : 'transparent',
          opacity: disabled ? state.disabledOpacity : 1,
        },
        pressed && pressedStyle,
        style,
      ]}>
      <View style={mirrorInRtl && rtl ? { transform: [{ scaleX: -1 }] } : undefined}>
        <Icon name={icon} color={filled ? p.onLung : p.lung} size={filled ? 22 : 24} />
      </View>
      {children}
    </Pressable>
  );
}
