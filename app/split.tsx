import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useDocuments } from '@/store/documents';
import { resolveSourcePdf, sourceName, type SplitSource } from '@/features/split';
import { getPdfPageCount, splitPdfInTwo, splitPdfEveryPage, type SplitPart } from '@/lib/pdfSplit';
import { savePdfToDevice } from '@/lib/save';
import { shareFile } from '@/lib/share';
import { showInterstitialAd } from '@/lib/ads';
import {
  Button, IconButton, PaperCard, ResultSuccess, Screen, SourceList, type SourceRow,
} from '@/components/ui';
import { colors, spacing } from '@/theme/colors';
import { type } from '@/theme/typography';

type Phase = 'pick' | 'options' | 'result';

export default function SplitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const documents = useDocuments((s) => s.documents);

  const [phase, setPhase] = useState<Phase>('pick');
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [splitAt, setSplitAt] = useState(1);
  const [parts, setParts] = useState<SplitPart[]>([]);

  const items: SourceRow[] = documents.map((d) => ({
    key: d.id,
    title: d.title,
    subtitle: `${d.pages.length} ${d.pages.length === 1 ? 'page' : 'pages'}`,
    coverUri: d.pages[0]?.processedUri,
    trailing: 'chevron',
  }));

  const chooseSource = async (src: SplitSource) => {
    setBusy(true);
    try {
      const uri = await resolveSourcePdf(src);
      const n = await getPdfPageCount(uri);
      if (n < 2) {
        Alert.alert('Can’t split', 'This PDF has only one page.');
        return;
      }
      setPdfUri(uri);
      setName(sourceName(src));
      setPageCount(n);
      setSplitAt(Math.floor(n / 2));
      setPhase('options');
    } catch (err) {
      Alert.alert('Could not open PDF', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const onImportPdf = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.length) return;
    const a = res.assets[0];
    chooseSource({ kind: 'pdf', uri: a.uri, name: a.name ?? 'document.pdf' });
  };

  const runSplit = async (mode: 'two' | 'each') => {
    if (!pdfUri || busy) return;
    setBusy(true);
    try {
      const result = mode === 'two'
        ? await splitPdfInTwo(pdfUri, splitAt)
        : await splitPdfEveryPage(pdfUri);
      setParts(result);
      setPhase('result');
    } catch (err) {
      Alert.alert('Split failed', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const onSave = async (part: SplitPart) => {
    try {
      await showInterstitialAd();
      const r = await savePdfToDevice(part.uri, `${name} ${part.label}.pdf`);
      if (r.status === 'saved') Alert.alert('Saved', 'The PDF was saved to your phone.');
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : String(err));
    }
  };

  if (phase === 'result') {
    return (
      <Screen>
        <ResultSuccess
          title="Split complete"
          subtitle={`${parts.length} files created.`}
          onDone={() => router.back()}
          detail={
            <View style={styles.parts}>
              {parts.map((p) => (
                <PaperCard key={p.uri} style={styles.partRow}>
                  <Ionicons name="document-text-outline" size={22} color={colors.primary} />
                  <Text style={styles.partLabel} numberOfLines={1}>{p.label}</Text>
                  <IconButton
                    icon="download-outline"
                    accessibilityLabel={`Save ${p.label}`}
                    tone="primary"
                    onPress={() => onSave(p)}
                  />
                  <IconButton
                    icon="share-social-outline"
                    accessibilityLabel={`Share ${p.label}`}
                    tone="primary"
                    onPress={async () => { await showInterstitialAd(); await shareFile(p.uri, 'application/pdf'); }}
                  />
                </PaperCard>
              ))}
            </View>
          }
        />
      </Screen>
    );
  }

  if (phase === 'options') {
    return (
      <Screen style={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.lg }}>
        <Text style={styles.sourceName} numberOfLines={1}>{name}</Text>
        <Text style={styles.sourceSub}>{pageCount} pages</Text>

        <Text style={styles.section}>Split into two parts</Text>
        <PaperCard style={styles.stepperCard}>
          <Text style={styles.stepperLabel}>First part: pages 1–{splitAt}</Text>
          <Text style={styles.stepperLabel}>Second part: pages {splitAt + 1}–{pageCount}</Text>
          <View style={styles.stepper}>
            <IconButton
              icon="remove"
              accessibilityLabel="Split earlier"
              disabled={splitAt <= 1}
              onPress={() => setSplitAt((v) => Math.max(1, v - 1))}
            />
            <Text style={styles.stepValue}>after page {splitAt}</Text>
            <IconButton
              icon="add"
              accessibilityLabel="Split later"
              disabled={splitAt >= pageCount - 1}
              onPress={() => setSplitAt((v) => Math.min(pageCount - 1, v + 1))}
            />
          </View>
          <Button
            label="Split into 2 parts"
            onPress={() => runSplit('two')}
            disabled={busy}
            loading={busy}
          />
        </PaperCard>

        <Text style={styles.section}>Or</Text>
        <Button
          label={`Split every page separately (${pageCount} files)`}
          icon="albums-outline"
          variant="secondary"
          onPress={() => runSplit('each')}
          disabled={busy}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <SourceList
        items={items}
        onPressItem={(item) => {
          const doc = documents.find((d) => d.id === item.key);
          if (doc) chooseSource({ kind: 'doc', doc });
        }}
        onImport={onImportPdf}
        importLabel="Choose a PDF from your phone"
        hint="…or pick one of your documents to split:"
        emptyText="No documents yet — import a PDF from your phone above."
        contentPaddingBottom={insets.bottom + spacing.lg}
        listHeader={busy ? (
          <View style={{ marginTop: spacing.md, alignItems: 'center' }}>
            <Text style={styles.sourceSub}>Opening PDF…</Text>
          </View>
        ) : undefined}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sourceName: { ...type.title, fontSize: 20 },
  sourceSub: { ...type.caption, marginTop: 2, marginBottom: spacing.lg, fontSize: 13 },
  section: { ...type.section, marginBottom: spacing.sm, marginTop: spacing.md },
  stepperCard: { gap: spacing.sm, marginBottom: spacing.sm },
  stepperLabel: { fontSize: 14, color: colors.text },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginVertical: spacing.md,
  },
  stepValue: { fontSize: 15, fontWeight: '700', color: colors.text, minWidth: 110, textAlign: 'center' },
  parts: { width: '100%', gap: spacing.sm, marginBottom: spacing.lg },
  partRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  partLabel: { flex: 1, fontSize: 14, color: colors.text },
});
