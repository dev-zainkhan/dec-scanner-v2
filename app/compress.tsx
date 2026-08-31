import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useDocuments } from '@/store/documents';
import {
  compressDocument, compressPdfFile, COMPRESS_LEVELS, formatBytes,
  type CompressLevel, type CompressResult,
} from '@/lib/compress';
import { savePdfToDevice } from '@/lib/save';
import { shareFile } from '@/lib/share';
import type { DocumentRecord } from '@/types';
import { Button, ResultSuccess, Screen, SourceList, type SourceRow } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/colors';
import { type } from '@/theme/typography';

type Phase = 'pick' | 'options' | 'result';
type Source = { kind: 'doc'; doc: DocumentRecord } | { kind: 'pdf'; uri: string; name: string };

export default function CompressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const documents = useDocuments((s) => s.documents);

  const [phase, setPhase] = useState<Phase>('pick');
  const [source, setSource] = useState<Source | null>(null);
  const [level, setLevel] = useState<CompressLevel>('balanced');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CompressResult | null>(null);

  const sourceName = source ? (source.kind === 'doc' ? source.doc.title : source.name) : '';
  const sourceSub = source
    ? source.kind === 'doc'
      ? `${source.doc.pages.length} ${source.doc.pages.length === 1 ? 'page' : 'pages'}`
      : 'PDF from your phone'
    : '';

  const items: SourceRow[] = documents.map((d) => ({
    key: d.id,
    title: d.title,
    subtitle: `${d.pages.length} ${d.pages.length === 1 ? 'page' : 'pages'}`,
    coverUri: d.pages[0]?.processedUri,
    trailing: 'chevron',
  }));

  const onImportPdf = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.length) return;
    const a = res.assets[0];
    setSource({ kind: 'pdf', uri: a.uri, name: a.name ?? 'document.pdf' });
    setPhase('options');
  };

  const onCompress = async () => {
    if (!source || busy) return;
    setBusy(true);
    try {
      const r = source.kind === 'doc'
        ? await compressDocument(source.doc, level)
        : await compressPdfFile(source.uri, source.name, level);
      setResult(r);
      setPhase('result');
    } catch (err) {
      Alert.alert('Compress failed', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const onSave = async () => {
    if (!result) return;
    try {
      const r = await savePdfToDevice(result.uri, `${sourceName} (compressed).pdf`);
      if (r.status === 'saved') Alert.alert('Saved', 'The PDF was saved to your phone.');
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : String(err));
    }
  };

  if (phase === 'result' && result) {
    const pct = result.gained
      ? Math.max(1, Math.round((1 - result.compressedSize / result.originalSize) * 100))
      : 0;
    return (
      <Screen>
        <ResultSuccess
          title={result.gained ? 'Compressed' : 'Already optimized'}
          subtitle={
            result.gained
              ? undefined
              : `This file is ${formatBytes(result.originalSize)} and couldn’t be made smaller without hurting quality. We kept the original.`
          }
          tone={result.gained ? 'success' : 'info'}
          icon={result.gained ? 'checkmark' : 'information'}
          onDone={() => router.back()}
          detail={
            result.gained ? (
              <View style={styles.sizeBlock}>
                <View style={styles.sizeRow}>
                  <Text style={styles.sizeOld}>{formatBytes(result.originalSize)}</Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.textMuted} />
                  <Text style={styles.sizeNew}>{formatBytes(result.compressedSize)}</Text>
                </View>
                <Text style={styles.pct}>{pct}% smaller</Text>
              </View>
            ) : null
          }
        >
          <Button label="Save to Phone" icon="download-outline" onPress={onSave} />
          <Button
            label="Share"
            icon="share-social-outline"
            variant="secondary"
            onPress={() => shareFile(result.uri, 'application/pdf')}
          />
        </ResultSuccess>
      </Screen>
    );
  }

  if (phase === 'options' && source) {
    return (
      <Screen style={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.lg }}>
        <Text style={styles.sourceName} numberOfLines={1}>{sourceName}</Text>
        <Text style={styles.sourceSub}>{sourceSub}</Text>

        <Text style={styles.section}>Compression level</Text>
        {COMPRESS_LEVELS.map((l) => {
          const active = l.id === level;
          return (
            <Pressable
              key={l.id}
              onPress={() => setLevel(l.id)}
              style={({ pressed }: { pressed: boolean }) => [
                styles.levelRow,
                active && styles.levelActive,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={active ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={active ? colors.primary : colors.textMuted}
              />
              <View style={styles.levelMeta}>
                <Text style={[styles.levelLabel, active && { color: colors.primary }]}>{l.label}</Text>
                <Text style={styles.levelHint}>{l.hint}</Text>
              </View>
            </Pressable>
          );
        })}

        <View style={{ marginTop: spacing.lg }}>
          <Button label="Compress" onPress={onCompress} disabled={busy} loading={busy} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <SourceList
        items={items}
        onPressItem={(item) => {
          const doc = documents.find((d) => d.id === item.key);
          if (!doc) return;
          setSource({ kind: 'doc', doc });
          setPhase('options');
        }}
        onImport={onImportPdf}
        importLabel="Compress a PDF from your phone"
        hint="…or pick one of your documents:"
        emptyText="No documents yet — import a PDF from your phone above."
        contentPaddingBottom={insets.bottom + spacing.lg}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  sourceName: { ...type.title, fontSize: 20 },
  sourceSub: { ...type.caption, marginTop: 2, marginBottom: spacing.lg, fontSize: 13 },
  section: { ...type.section, marginBottom: spacing.sm },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  levelActive: { borderColor: colors.primary, backgroundColor: colors.tintTeal },
  levelMeta: { flex: 1 },
  levelLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  levelHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  sizeBlock: { alignItems: 'center', marginBottom: spacing.xl },
  sizeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: 4 },
  sizeOld: { fontSize: 16, color: colors.textMuted, textDecorationLine: 'line-through' },
  sizeNew: { fontSize: 22, fontWeight: '800', color: colors.text },
  pct: { fontSize: 14, color: colors.success, fontWeight: '700' },
});
