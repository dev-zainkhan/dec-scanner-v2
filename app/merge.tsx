import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { mergePdfs } from '@/lib/pdf';
import { timestamp } from '@/lib/format';
import { useDocuments } from '@/store/documents';
import { docSource, pickPdfs, sourceRow, sourceToPdf, type PdfSource } from '@/features/sources';
import { errorMessage, savePdfWithAd, sharePdfWithAd } from '@/features/fileActions';
import { Button, ResultSuccess, Screen, SourceList } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function MergeScreen() {
  const router = useRouter();
  const documents = useDocuments((s) => s.documents);
  const [imported, setImported] = useState<PdfSource[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ uri: string; name: string } | null>(null);

  const sources = useMemo(() => [...imported, ...documents.map(docSource)], [imported, documents]);

  if (result) {
    return (
      <Screen>
        <ResultSuccess
          title="Merged PDF ready"
          subtitle={`${order.length} items combined into one PDF.`}
          onDone={() => router.back()}
        >
          <Button label="Save to Phone" icon="download-outline" onPress={() => savePdfWithAd(result.uri, result.name)} />
          <Button
            label="Share"
            icon="share-social-outline"
            variant="secondary"
            onPress={() => sharePdfWithAd(result.uri)}
          />
        </ResultSuccess>
      </Screen>
    );
  }

  const toggle = (key: string) =>
    setOrder((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  const onAddPdfs = async () => {
    try {
      const added = await pickPdfs(true);
      setImported((cur) => [...added, ...cur]);
      setOrder((cur) => [...cur, ...added.map((a) => a.key)]);
    } catch (err) {
      Alert.alert('Could not add PDF', errorMessage(err));
    }
  };

  const onMerge = async () => {
    setBusy(true);
    try {
      const pdfs: string[] = [];
      for (const key of order) {
        const source = sources.find((s) => s.key === key);
        if (source) pdfs.push(await sourceToPdf(source));
      }
      const name = `Merged ${timestamp()}`;
      setResult({ uri: await mergePdfs(pdfs, name), name });
    } catch (err) {
      Alert.alert('Merge failed', errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <SourceList
        items={sources.map(sourceRow)}
        selectedKeys={order}
        onPressItem={(item) => toggle(item.key)}
        onImport={onAddPdfs}
        importLabel="Add PDFs from your phone"
        hint="Tap items in the order you want them combined."
        emptyText="No documents yet. Add a PDF from your phone, or scan one first."
      />
      <View style={styles.footer}>
        <Button
          label={order.length < 2 ? 'Select at least 2 items' : `Merge ${order.length} items`}
          onPress={onMerge}
          disabled={order.length < 2}
          loading={busy}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
});
