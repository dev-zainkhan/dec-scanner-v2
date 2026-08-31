import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDocuments } from '@/store/documents';
import { usePrefs } from '@/store/prefs';
import { DocumentCard } from '@/components/DocumentCard';
import { useScanToDocument } from '@/hooks/useScanToDocument';
import { EmptyState, IconButton, Screen, ScreenHeader, SearchField } from '@/components/ui';
import { colors, radius, spacing, shadow } from '@/theme/colors';
import type { DocumentRecord } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const documents = useDocuments((s) => s.documents);
  const layout = usePrefs((s) => s.libraryLayout);
  const setLibraryLayout = usePrefs((s) => s.setLibraryLayout);
  const { scan, scanning } = useScanToDocument();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((d) => d.title.toLowerCase().includes(q));
  }, [documents, query]);

  const gridWidth = (width - spacing.lg * 2 - spacing.md) / 2;
  const isGrid = layout === 'grid';
  const countLabel =
    documents.length === 0
      ? 'Your scanned pages live here'
      : `${documents.length} ${documents.length === 1 ? 'document' : 'documents'}`;

  const openDoc = (id: string) =>
    router.push({ pathname: '/document/[id]', params: { id } });

  return (
    <Screen>
      <ScreenHeader
        title="Library"
        subtitle={countLabel}
        action={
          documents.length > 0 ? (
            <View style={styles.layoutToggle}>
              <IconButton
                icon="grid-outline"
                accessibilityLabel="Grid view"
                selected={isGrid}
                tone={isGrid ? 'primary' : 'muted'}
                onPress={() => setLibraryLayout('grid')}
              />
              <IconButton
                icon="list-outline"
                accessibilityLabel="List view"
                selected={!isGrid}
                tone={!isGrid ? 'primary' : 'muted'}
                onPress={() => setLibraryLayout('list')}
              />
            </View>
          ) : null
        }
      />

      {documents.length > 0 ? (
        <View style={styles.searchWrap}>
          <SearchField value={query} onChangeText={setQuery} />
        </View>
      ) : null}

      <FlatList
        key={layout}
        data={filtered}
        keyExtractor={(d: DocumentRecord) => d.id}
        style={{ flex: 1 }}
        numColumns={isGrid ? 2 : 1}
        columnWrapperStyle={isGrid ? styles.gridRow : undefined}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: documents.length > 0 ? 108 : spacing.xl,
          flexGrow: 1,
        }}
        renderItem={({ item }: { item: DocumentRecord }) =>
          isGrid ? (
            <View style={{ width: gridWidth }}>
              <DocumentCard doc={item} variant="grid" onPress={() => openDoc(item.id)} />
            </View>
          ) : (
            <View style={styles.listItem}>
              <DocumentCard doc={item} variant="list" onPress={() => openDoc(item.id)} />
            </View>
          )
        }
        ListEmptyComponent={
          query.trim() ? (
            <EmptyState
              icon="search-outline"
              title="Nothing matches"
              body="Try a different name, or scan a new page."
            />
          ) : (
            <EmptyState
              icon="document-text-outline"
              title="Your desk is empty"
              body="Scan a page and it will land here as a paper sheet."
              actionLabel="Scan a document"
              onAction={scan}
              actionLoading={scanning}
            />
          )
        }
      />

      {documents.length > 0 ? (
        <Pressable
          onPress={scan}
          disabled={scanning}
          accessibilityLabel="Scan a document"
          style={({ pressed }: { pressed: boolean }) => [
            styles.fab,
            pressed && styles.fabPressed,
            scanning && styles.fabDisabled,
          ]}
        >
          <Ionicons name="scan" size={26} color={colors.primaryText} />
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  layoutToggle: { flexDirection: 'row', gap: spacing.sm },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  gridRow: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  listItem: { marginBottom: spacing.md },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.fab,
  },
  fabPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  fabDisabled: { opacity: 0.55 },
});
