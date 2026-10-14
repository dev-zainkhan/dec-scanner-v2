import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  tone?: 'default' | 'primary' | 'danger' | 'muted';
  disabled?: boolean;
  selected?: boolean;
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  tone = 'default',
  disabled,
  selected,
}: Props) {
  const color =
    tone === 'danger' ? colors.danger
    : tone === 'primary' ? colors.primary
    : tone === 'muted' ? colors.textMuted
    : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}
      style={({ pressed }) => [
        styles.btn,
        selected && styles.selected,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Ionicons name={icon} size={20} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.tintTeal },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.35 },
});
