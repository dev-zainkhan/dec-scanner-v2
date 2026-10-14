import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { pageCount, relativeDate } from '@/lib/format';
import { colors, radius, shadow, spacing, type } from '@/theme';
import type { DocumentRecord } from '@/types';

interface Props {
  doc: DocumentRecord;
  onPress: () => void;
  variant: 'list' | 'grid';
}

export function DocumentCard({ doc, onPress, variant }: Props) {
  const cover = doc.pages[0]?.uri;
  const date = relativeDate(doc.updatedAt);
  const thumb = cover ? (
    <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
  ) : null;

  if (variant === 'grid') {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.gridCard, pressed && styles.pressed]}
      >
        <View style={styles.gridThumb}>
          {thumb}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{doc.pages.length}</Text>
          </View>
        </View>
        <Text style={styles.gridTitle} numberOfLines={1}>{doc.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>{date}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.listCard, pressed && styles.pressed]}
    >
      <View style={styles.listThumb}>{thumb}</View>
      <View style={styles.listMeta}>
        <Text style={styles.listTitle} numberOfLines={1}>{doc.title}</Text>
        <Text style={styles.meta}>{pageCount(doc.pages.length)} · {date}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.card,
  },
  listThumb: {
    width: 56,
    height: 74,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    marginRight: spacing.md,
  },
  listMeta: { flex: 1 },
  listTitle: { ...type.label, fontSize: 16, marginBottom: 4 },
  gridCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    ...shadow.card,
  },
  gridThumb: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.sm,
  },
  gridTitle: { ...type.label, fontSize: 14, paddingHorizontal: 2 },
  cover: { width: '100%', height: '100%' },
  meta: { fontSize: 12, color: colors.textMuted, paddingHorizontal: 2, marginTop: 2 },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.primaryText, fontSize: 11, fontWeight: '700' },
});
