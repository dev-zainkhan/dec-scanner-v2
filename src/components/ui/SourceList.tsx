import { type ReactElement } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, type } from '@/theme';

export interface SourceRow {
  key: string;
  title: string;
  subtitle: string;
  coverUri?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface Props {
  items: SourceRow[];
  onPressItem: (item: SourceRow) => void;
  onImport: () => void;
  importLabel: string;
  hint?: string;
  emptyText: string;
  /** Multi-select mode: keys in the order they were picked (shown as numbered badges). */
  selectedKeys?: string[];
  listHeader?: ReactElement | null;
  contentPaddingBottom?: number;
}

export function SourceList({
  items,
  onPressItem,
  onImport,
  importLabel,
  hint,
  emptyText,
  selectedKeys,
  listHeader,
  contentPaddingBottom = spacing.lg,
}: Props) {
  const multi = selectedKeys !== undefined;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.key}
      style={styles.list}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: contentPaddingBottom }}
      ListHeaderComponent={
        <View>
          <Pressable
            onPress={onImport}
            accessibilityRole="button"
            style={({ pressed }) => [styles.importBtn, pressed && styles.pressed]}
          >
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            <Text style={styles.importText}>{importLabel}</Text>
          </Pressable>
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
          {listHeader}
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
      renderItem={({ item }) => {
        const order = selectedKeys ? selectedKeys.indexOf(item.key) + 1 : 0;
        const selected = order > 0;
        return (
          <Pressable
            onPress={() => onPressItem(item)}
            accessibilityRole={multi ? 'checkbox' : 'button'}
            accessibilityState={multi ? { checked: selected } : undefined}
            style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && styles.pressed]}
          >
            {multi ? (
              <View style={[styles.badge, selected && styles.badgeOn]}>
                {selected ? <Text style={styles.badgeText}>{order}</Text> : <View style={styles.badgeEmpty} />}
              </View>
            ) : null}
            <View style={styles.thumb}>
              {item.coverUri ? (
                <Image source={{ uri: item.coverUri }} style={styles.thumbImg} />
              ) : (
                <Ionicons name={item.icon ?? 'document-text'} size={22} color={colors.textMuted} />
              )}
            </View>
            <View style={styles.meta}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.sub}>{item.subtitle}</Text>
            </View>
            {multi ? null : <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.tintTeal,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  importText: { color: colors.primary, fontSize: 15, fontWeight: '700', flex: 1 },
  hint: { ...type.caption, marginBottom: spacing.md, fontSize: 13 },
  empty: { ...type.subtitle, textAlign: 'center', marginTop: spacing.xl },
  pressed: { opacity: 0.7 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  rowSelected: { borderColor: colors.primary, backgroundColor: colors.tintTeal },
  badge: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  badgeOn: { backgroundColor: colors.primary },
  badgeText: { color: colors.primaryText, fontSize: 13, fontWeight: '700' },
  badgeEmpty: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
  },
  thumb: {
    width: 48,
    height: 62,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImg: { width: '100%', height: '100%' },
  meta: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
