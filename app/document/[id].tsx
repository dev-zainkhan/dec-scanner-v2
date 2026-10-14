import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDocuments } from '@/store/documents';
import { PageThumbnail } from '@/components/PageThumbnail';
import { scanPages } from '@/lib/scanner';
import { documentToPdf } from '@/lib/pdf';
import { pageCount } from '@/lib/format';
import { errorMessage, savePdfWithAd, sharePdfWithAd } from '@/features/fileActions';
import { Button, IconButton, Screen } from '@/components/ui';
import { colors, radius, spacing, type } from '@/theme';

type Busy = null | 'scan' | 'save' | 'share';

export default function DocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const doc = useDocuments((s) => s.documents.find((d) => d.id === id));
  const { renameDocument, deleteDocument, appendPages, deletePage, movePage } = useDocuments.getState();

  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [busy, setBusy] = useState<Busy>(null);
  const [titleDraft, setTitleDraft] = useState<string | null>(null);

  if (!doc) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.muted}>This document no longer exists.</Text>
      </Screen>
    );
  }

  // Fall back to the first page when nothing (or a deleted page) is selected.
  const selectedIndex = Math.max(0, doc.pages.findIndex((p) => p.id === selectedId));
  const selectedPage = doc.pages[selectedIndex];

  const run = async (kind: Exclude<Busy, null>, task: () => Promise<void>) => {
    if (busy) return;
    setBusy(kind);
    try {
      await task();
    } finally {
      setBusy(null);
    }
  };

  const exportPdf = async () => {
    try {
      return await documentToPdf(doc);
    } catch (err) {
      Alert.alert('Export failed', errorMessage(err));
      return null;
    }
  };

  const onSave = () =>
    run('save', async () => {
      const uri = await exportPdf();
      if (uri) await savePdfWithAd(uri, doc.title);
    });

  const onShare = () =>
    run('share', async () => {
      const uri = await exportPdf();
      if (uri) await sharePdfWithAd(uri);
    });

  const onAddPages = () =>
    run('scan', async () => {
      try {
        const pages = await scanPages();
        if (pages.length) appendPages(doc.id, pages);
      } catch (err) {
        Alert.alert('Scan failed', errorMessage(err));
      }
    });

  const confirmDeleteDocument = (message: string) =>
    Alert.alert('Delete document?', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDocument(doc.id);
          router.back();
        },
      },
    ]);

  const onDeletePage = (pageId: string) => {
    if (doc.pages.length === 1) {
      confirmDeleteDocument('This is the only page. Removing it deletes the whole document.');
      return;
    }
    Alert.alert('Delete this page?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePage(doc.id, pageId) },
    ]);
  };

  const commitTitle = () => {
    if (titleDraft !== null) renameDocument(doc.id, titleDraft);
    setTitleDraft(null);
  };

  return (
    <Screen>
      <View style={styles.titleRow}>
        {titleDraft !== null ? (
          <TextInput
            value={titleDraft}
            onChangeText={setTitleDraft}
            onSubmitEditing={commitTitle}
            onBlur={commitTitle}
            autoFocus
            selectTextOnFocus
            style={styles.titleInput}
            returnKeyType="done"
            maxLength={120}
          />
        ) : (
          <Pressable
            onPress={() => setTitleDraft(doc.title)}
            accessibilityRole="button"
            accessibilityHint="Rename document"
            style={styles.titleText}
          >
            <Text style={styles.title} numberOfLines={1}>{doc.title}</Text>
            <Text style={styles.subtitle}>Tap to rename · {pageCount(doc.pages.length)}</Text>
          </Pressable>
        )}
        <IconButton
          icon="trash-outline"
          accessibilityLabel="Delete document"
          tone="danger"
          disabled={busy !== null}
          onPress={() => confirmDeleteDocument(`"${doc.title}" will be removed permanently.`)}
        />
      </View>

      <View style={styles.preview}>
        {selectedPage ? (
          <Image source={{ uri: selectedPage.uri }} style={styles.previewImg} resizeMode="contain" />
        ) : null}
        {busy === 'scan' ? (
          <View style={styles.previewBusy}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.busyText}>Opening scanner…</Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.stripScroll}
        contentContainerStyle={styles.strip}
      >
        {doc.pages.map((page, index) => (
          <PageThumbnail
            key={page.id}
            page={page}
            index={index}
            selected={index === selectedIndex}
            onSelect={() => setSelectedId(page.id)}
          />
        ))}
      </ScrollView>
      {selectedPage ? (
        <View style={styles.stripControls}>
          <IconButton
            icon="chevron-back"
            accessibilityLabel="Move page earlier"
            disabled={selectedIndex === 0}
            onPress={() => movePage(doc.id, selectedPage.id, -1)}
          />
          <IconButton
            icon="chevron-forward"
            accessibilityLabel="Move page later"
            disabled={selectedIndex === doc.pages.length - 1}
            onPress={() => movePage(doc.id, selectedPage.id, 1)}
          />
          <IconButton
            icon="close"
            accessibilityLabel="Delete this page"
            tone="danger"
            onPress={() => onDeletePage(selectedPage.id)}
          />
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          label="Save to Phone"
          icon="download-outline"
          onPress={onSave}
          disabled={busy !== null}
          loading={busy === 'save'}
        />
        <View style={styles.actionRow}>
          <Button
            label="Share"
            icon="share-social-outline"
            variant="secondary"
            flex
            onPress={onShare}
            disabled={busy !== null}
            loading={busy === 'share'}
          />
          <Button
            label="Add pages"
            icon="add"
            variant="secondary"
            flex
            onPress={onAddPages}
            disabled={busy !== null}
            loading={busy === 'scan'}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.textMuted, fontSize: 14 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  titleText: { flex: 1 },
  title: { ...type.title, fontSize: 20 },
  subtitle: { ...type.caption, marginTop: 2 },
  titleInput: {
    ...type.title,
    flex: 1,
    fontSize: 20,
    borderBottomWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 4,
  },
  preview: {
    flex: 1,
    minHeight: 220,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImg: { width: '100%', height: '100%' },
  previewBusy: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.wash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busyText: { marginTop: spacing.sm, color: colors.text, fontSize: 13 },
  stripScroll: { flexGrow: 0 },
  strip: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  stripControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
});
