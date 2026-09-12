import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDocuments } from '@/store/documents';
import { PageThumbnail } from '@/components/PageThumbnail';
import { scanNewPages } from '@/lib/scanner';
import { exportDocumentToPdf } from '@/lib/pdf';
import { shareFile } from '@/lib/share';
import { savePdfToDevice } from '@/lib/save';
import { showInterstitialAd } from '@/lib/ads';
import { Button, IconButton, Screen } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/colors';
import { type } from '@/theme/typography';

export default function DocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const doc = useDocuments((s) => s.documents.find((d) => d.id === id));
  const renameDocument = useDocuments((s) => s.renameDocument);
  const deleteDocument = useDocuments((s) => s.deleteDocument);
  const appendPages = useDocuments((s) => s.appendPages);
  const deletePage = useDocuments((s) => s.deletePage);
  const movePage = useDocuments((s) => s.movePage);

  const [selectedPageId, setSelectedPageId] = useState<string | undefined>(doc?.pages[0]?.id);
  const [busy, setBusy] = useState<null | 'pdf' | 'scan' | 'save'>(null);
  const [titleDraft, setTitleDraft] = useState(doc?.title ?? '');
  const [editingTitle, setEditingTitle] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: '' });
  }, [navigation]);

  useEffect(() => {
    if (!doc) return;
    if (!doc.pages.some((p) => p.id === selectedPageId)) {
      setSelectedPageId(doc.pages[0]?.id);
    }
  }, [doc, selectedPageId]);

  const selectedPage = useMemo(
    () => doc?.pages.find((p) => p.id === selectedPageId),
    [doc, selectedPageId],
  );
  const selectedIndex = doc?.pages.findIndex((p) => p.id === selectedPageId) ?? -1;

  if (!doc) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.muted}>Document not found.</Text>
      </Screen>
    );
  }

  const onAddPages = async () => {
    if (busy) return;
    setBusy('scan');
    try {
      const pages = await scanNewPages();
      if (pages.length) appendPages(doc.id, pages);
    } catch (err) {
      Alert.alert('Scan failed', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const onDeletePage = (pageId: string) => {
    if (doc.pages.length === 1) {
      Alert.alert(
        'Delete document?',
        'This is the only page. Removing it will delete the whole document.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteDocument(doc.id);
              router.back();
            },
          },
        ],
      );
      return;
    }
    Alert.alert('Delete this page?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePage(doc.id, pageId) },
    ]);
  };

  const onExportAndShare = async () => {
    if (busy) return;
    setBusy('pdf');
    try {
      await showInterstitialAd();
      const uri = await exportDocumentToPdf(doc);
      await shareFile(uri, 'application/pdf');
    } catch (err) {
      Alert.alert('Export failed', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const onSaveToPhone = async () => {
    if (busy) return;
    setBusy('save');
    try {
      await showInterstitialAd();
      const uri = await exportDocumentToPdf(doc);
      const r = await savePdfToDevice(uri, `${doc.title}.pdf`);
      if (r.status === 'saved') Alert.alert('Saved', 'The PDF was saved to your phone.');
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const onDeleteDocument = () =>
    Alert.alert('Delete document?', `"${doc.title}" will be removed permanently.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteDocument(doc.id);
          router.back();
        },
      },
    ]);

  const locked = busy !== null || doc.pages.length === 0;

  return (
    <Screen>
      <View style={styles.titleRow}>
        {editingTitle ? (
          <TextInput
            value={titleDraft}
            onChangeText={setTitleDraft}
            onSubmitEditing={() => { renameDocument(doc.id, titleDraft); setEditingTitle(false); }}
            onBlur={() => { renameDocument(doc.id, titleDraft); setEditingTitle(false); }}
            autoFocus
            style={styles.titleInput}
            returnKeyType="done"
            maxLength={120}
          />
        ) : (
          <Pressable onPress={() => { setTitleDraft(doc.title); setEditingTitle(true); }} style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{doc.title}</Text>
            <Text style={styles.subtitle}>
              Tap to rename · {doc.pages.length} {doc.pages.length === 1 ? 'page' : 'pages'}
            </Text>
          </Pressable>
        )}
        <IconButton
          icon="trash-outline"
          accessibilityLabel="Delete document"
          tone="danger"
          disabled={busy !== null}
          onPress={onDeleteDocument}
        />
      </View>

      <View style={styles.preview}>
        {selectedPage ? (
          <Image
            source={{ uri: selectedPage.processedUri }}
            style={styles.previewImg}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.muted}>No page selected</Text>
        )}
        {busy === 'scan' && (
          <View style={styles.previewBusy}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.busyText}>Opening scanner…</Text>
          </View>
        )}
      </View>

      <View style={styles.stripBlock}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
        >
          {doc.pages.map((page, index) => (
            <PageThumbnail
              key={page.id}
              page={page}
              index={index}
              selected={page.id === selectedPageId}
              onSelect={() => setSelectedPageId(page.id)}
            />
          ))}
        </ScrollView>
        {selectedPageId ? (
          <View style={styles.stripControls}>
            <IconButton
              icon="chevron-back"
              accessibilityLabel="Move page earlier"
              disabled={selectedIndex <= 0}
              onPress={() => movePage(doc.id, selectedPageId, -1)}
            />
            <IconButton
              icon="chevron-forward"
              accessibilityLabel="Move page later"
              disabled={selectedIndex < 0 || selectedIndex >= doc.pages.length - 1}
              onPress={() => movePage(doc.id, selectedPageId, 1)}
            />
            <IconButton
              icon="close"
              accessibilityLabel="Delete this page"
              tone="danger"
              onPress={() => onDeletePage(selectedPageId)}
            />
          </View>
        ) : null}
      </View>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <Button
          label={busy === 'save' ? 'Saving…' : 'Save to Phone'}
          icon="download-outline"
          onPress={onSaveToPhone}
          disabled={locked}
          loading={busy === 'save'}
        />
        <View style={styles.actionRow}>
          <Button
            label={busy === 'pdf' ? 'Preparing…' : 'Share'}
            icon="share-social-outline"
            variant="secondary"
            flex
            onPress={onExportAndShare}
            disabled={locked}
            loading={busy === 'pdf'}
          />
          <Button
            label={busy === 'scan' ? 'Opening…' : 'Add pages'}
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: { ...type.title, fontSize: 20 },
  subtitle: { ...type.caption, marginTop: 2 },
  titleInput: {
    flex: 1,
    ...type.title,
    fontSize: 20,
    borderBottomWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 4,
  },

  preview: {
    flex: 1,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: 220,
  },
  previewImg: { width: '100%', height: '100%' },
  previewBusy: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.wash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busyText: { marginTop: spacing.sm, color: colors.text, fontSize: 13 },

  stripBlock: {
    paddingTop: spacing.md,
  },
  strip: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
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
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
});
