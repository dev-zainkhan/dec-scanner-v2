import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useDocuments } from '@/store/documents';
import { mergeSourcesToPdf, defaultMergedName, type MergeSource } from '@/features/merge';
import { savePdfToDevice } from '@/lib/save';
import { shareFile } from '@/lib/share';
import { Button, ResultSuccess, Screen, SourceList, type SourceRow } from '@/components/ui';
import { colors, spacing } from '@/theme/colors';

interface ImportedPdf { key: string; uri: string; name: string }

export default function MergeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const documents = useDocuments((s) => s.documents);

  const [imported, setImported] = useState<ImportedPdf[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);

  const sources = useMemo<MergeSource[]>(() => {
    const pdfs: MergeSource[] = imported.map((p) => ({ kind: 'pdf', key: p.key, uri: p.uri, name: p.name }));
    const docs: MergeSource[] = documents.map((d) => ({ kind: 'doc', key: `doc:${d.id}`, doc: d }));
    return [...pdfs, ...docs];
  }, [imported, documents]);

  const items: SourceRow[] = sources.map((item) => {
    const idx = order.indexOf(item.key);
    const selected = idx >= 0;
    return {
      key: item.key,
      title: item.kind === 'doc' ? item.doc.title : item.name,
      subtitle: item.kind === 'doc'
        ? `${item.doc.pages.length} ${item.doc.pages.length === 1 ? 'page' : 'pages'}`
        : 'PDF from phone',
      coverUri: item.kind === 'doc' ? item.doc.pages[0]?.processedUri : undefined,
      icon: item.kind === 'pdf' ? 'document-text' : 'image',
      selectable: true,
      selected,
      order: selected ? idx + 1 : undefined,
    };
  });

  const toggle = (key: string) =>
    setOrder((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  const onAddPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.length) return;
      const added: ImportedPdf[] = res.assets.map((a, i) => ({
        key: `pdf:${Date.now().toString(36)}_${i}`,
        uri: a.uri,
        name: a.name ?? 'document.pdf',
      }));
      setImported((cur) => [...added, ...cur]);
      setOrder((cur) => [...cur, ...added.map((a) => a.key)]);
    } catch (err) {
      Alert.alert('Could not add PDF', err instanceof Error ? err.message : String(err));
    }
  };

  const onMerge = async () => {
    if (order.length < 2 || busy) return;
    setBusy(true);
    try {
      const ordered = order
        .map((k) => sources.find((s) => s.key === k))
        .filter((s): s is MergeSource => !!s);
      const uri = await mergeSourcesToPdf(ordered, defaultMergedName());
      setResultUri(uri);
    } catch (err) {
      Alert.alert('Merge failed', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const onSave = async () => {
    if (!resultUri) return;
    try {
      const r = await savePdfToDevice(resultUri, `${defaultMergedName()}.pdf`);
      if (r.status === 'saved') Alert.alert('Saved', 'The merged PDF was saved to your phone.');
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : String(err));
    }
  };

  if (resultUri) {
    return (
      <Screen>
        <ResultSuccess
          title="Merged PDF ready"
          subtitle={`${order.length} items combined into one PDF.`}
          onDone={() => router.back()}
        >
          <Button label="Save to Phone" icon="download-outline" onPress={onSave} />
          <Button
            label="Share"
            icon="share-social-outline"
            variant="secondary"
            onPress={() => shareFile(resultUri, 'application/pdf')}
          />
        </ResultSuccess>
      </Screen>
    );
  }

  const canMerge = order.length >= 2 && !busy;
  return (
    <Screen>
      <SourceList
        items={items}
        onPressItem={(item) => toggle(item.key)}
        onImport={onAddPdf}
        importLabel="Add PDF from your phone"
        hint="Tap items in the order you want them combined."
        emptyText="No documents yet. Add a PDF from your phone, or scan one first."
        contentPaddingBottom={insets.bottom + 96}
      />
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Button
          label={order.length < 2 ? 'Select at least 2 items' : `Merge ${order.length} items`}
          onPress={onMerge}
          disabled={!canMerge}
          loading={busy}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
});
