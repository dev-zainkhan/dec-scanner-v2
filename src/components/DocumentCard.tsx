import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/colors';
import { type } from '@/theme/typography';
import type { DocumentRecord } from '@/types';

interface Props {
  doc: DocumentRecord;
  onPress: () => void;
  variant?: 'list' | 'grid';
}

function formatRelativeDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfThat = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfThat) / 86_400_000);
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (dayDiff === 0) return `Today, ${time}`;
  if (dayDiff === 1) return 'Yesterday';
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function DocumentCard({ doc, onPress, variant = 'list' }: Props) {
  const cover = doc.pages[0]?.processedUri;
  const pages = `${doc.pages.length} ${doc.pages.length === 1 ? 'page' : 'pages'}`;
  const date = formatRelativeDate(doc.updatedAt);

  if (variant === 'grid') {
    return (
      <Pressable onPress={onPress} style={({ pressed }: { pressed: boolean }) => [styles.gridCard, pressed && styles.pressed]}>
        <View style={styles.gridThumb}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={[styles.cover, styles.empty]} />
          )}
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
    <Pressable onPress={onPress} style={({ pressed }: { pressed: boolean }) => [styles.listCard, pressed && styles.pressed]}>
      <View style={styles.listThumb}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.empty]} />
        )}
      </View>
      <View style={styles.listMeta}>
        <Text style={styles.listTitle} numberOfLines={1}>{doc.title}</Text>
        <Text style={styles.meta}>{pages} · {date}</Text>
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
  listTitle: { ...type.label, fontSize: 16, marginBottom: 4, color: colors.text },
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
  gridTitle: { ...type.label, fontSize: 14, color: colors.text, paddingHorizontal: 2 },
  cover: { width: '100%', height: '100%' },
  empty: { backgroundColor: colors.surfaceAlt },
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
