import { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/colors';

interface Props {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  selected?: boolean;
}

export function PaperCard({ children, style, padded = true, selected }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: selected ? colors.primary : colors.border,
          ...(padded ? { padding: spacing.md } : null),
          ...shadow.card,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
