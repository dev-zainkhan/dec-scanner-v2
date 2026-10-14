import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getPdfPageCount, splitPdfEveryPage, splitPdfInTwo, type PdfPart } from '@/lib/pdf';
import { sourceTitle, sourceToPdf, type PdfSource } from '@/features/sources';
import { errorMessage, savePdfWithAd, sharePdfWithAd } from '@/features/fileActions';
import { SourcePicker } from '@/components/SourcePicker';
import { Button, IconButton, PaperCard, ResultSuccess, Screen } from '@/components/ui';
import { colors, spacing, type } from '@/theme';

interface OpenedPdf {
  uri: string;
  title: string;
  pages: number;
}

export default function SplitScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pdf, setPdf] = useState<OpenedPdf | null>(null);
  const [splitAt, setSplitAt] = useState(1);
  const [parts, setParts] = useState<PdfPart[] | null>(null);

  const open = async (source: PdfSource) => {
    setBusy(true);
    try {
      const uri = await sourceToPdf(source);
      const pages = await getPdfPageCount(uri);
      if (pages < 2) {
        Alert.alert('Can’t split', 'This PDF has only one page.');
        return;
      }
      setPdf({ uri, title: sourceTitle(source), pages });
      setSplitAt(Math.floor(pages / 2));
    } catch (err) {
      Alert.alert('Could not open PDF', errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!pdf) {
    return (
      <Screen>
        <SourcePicker
          onPick={open}
          importLabel="Choose a PDF from your phone"
          hint="…or pick one of your documents to split:"
          listHeader={busy ? <Text style={styles.opening}>Opening PDF…</Text> : null}
        />
      </Screen>
    );
  }

  if (parts) {
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
                    onPress={() => savePdfWithAd(p.uri, `${pdf.title} ${p.label}`)}
                  />
                  <IconButton
                    icon="share-social-outline"
                    accessibilityLabel={`Share ${p.label}`}
                    tone="primary"
                    onPress={() => sharePdfWithAd(p.uri)}
                  />
                </PaperCard>
              ))}
            </View>
          }
        />
      </Screen>
    );
  }

  const runSplit = async (mode: 'two' | 'each') => {
    setBusy(true);
    try {
      setParts(
        mode === 'two'
          ? await splitPdfInTwo(pdf.uri, splitAt, pdf.title)
          : await splitPdfEveryPage(pdf.uri, pdf.title),
      );
    } catch (err) {
      Alert.alert('Split failed', errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={styles.page}>
      <Text style={styles.sourceName} numberOfLines={1}>{pdf.title}</Text>
      <Text style={styles.sourceSub}>{pdf.pages} pages</Text>

      <Text style={styles.section}>Split into two parts</Text>
      <PaperCard style={styles.stepperCard}>
        <Text style={styles.stepperLabel}>First part: pages 1–{splitAt}</Text>
        <Text style={styles.stepperLabel}>Second part: pages {splitAt + 1}–{pdf.pages}</Text>
        <View style={styles.stepper}>
          <IconButton
            icon="remove"
            accessibilityLabel="Split earlier"
            disabled={busy || splitAt <= 1}
            onPress={() => setSplitAt((v) => Math.max(1, v - 1))}
          />
          <Text style={styles.stepValue}>after page {splitAt}</Text>
          <IconButton
            icon="add"
            accessibilityLabel="Split later"
            disabled={busy || splitAt >= pdf.pages - 1}
            onPress={() => setSplitAt((v) => Math.min(pdf.pages - 1, v + 1))}
          />
        </View>
        <Button label="Split into 2 parts" onPress={() => runSplit('two')} loading={busy} />
      </PaperCard>

      <Text style={styles.section}>Or</Text>
      <Button
        label={`Split every page separately (${pdf.pages} files)`}
        icon="albums-outline"
        variant="secondary"
        onPress={() => runSplit('each')}
        disabled={busy}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { padding: spacing.lg },
  opening: { ...type.caption, textAlign: 'center', marginBottom: spacing.md, fontSize: 13 },
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
