import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import type { Page } from '@/types';

interface Props {
  page: Page;
  index: number;
  selected: boolean;
  onSelect: () => void;
}

export function PageThumbnail({ page, index, selected, onSelect }: Props) {
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityLabel={`Page ${index + 1}`}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.sheet, selected && styles.sheetSelected, pressed && styles.pressed]}
    >
      <Image source={{ uri: page.uri }} style={styles.thumb} resizeMode="cover" />
      <View style={[styles.indexBadge, selected && styles.indexBadgeOn]}>
        <Text style={styles.indexText}>{index + 1}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheet: {
    width: 72,
    height: 96,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: spacing.sm,
  },
  sheetSelected: { borderColor: colors.primary },
  pressed: { opacity: 0.8 },
  thumb: { width: '100%', height: '100%' },
  indexBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: colors.overlay,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  indexBadgeOn: { backgroundColor: colors.primary },
  indexText: { color: colors.primaryText, fontSize: 11, fontWeight: '700' },
});
