import { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/theme';

interface Props {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, style }: Props) {
  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
      {children}
    </View>
  );
}
