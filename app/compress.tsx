import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { compressDocument, compressPdf, COMPRESS_LEVELS, type CompressLevel, type CompressResult } from '@/lib/compress';
import { formatBytes, pageCount } from '@/lib/format';
import { sourceTitle, type PdfSource } from '@/features/sources';
import { errorMessage, savePdfWithAd, sharePdfWithAd } from '@/features/fileActions';
import { SourcePicker } from '@/components/SourcePicker';
import { Button, ResultSuccess, Screen } from '@/components/ui';
import { colors, radius, spacing, type } from '@/theme';

export default function CompressScreen() {
  const router = useRouter();
  const [source, setSource] = useState<PdfSource | null>(null);
  const [level, setLevel] = useState<CompressLevel>('balanced');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CompressResult | null>(null);

  if (!source) {
    return (
      <Screen>
        <SourcePicker
          onPick={setSource}
          importLabel="Compress a PDF from your phone"
          hint="…or pick one of your documents:"
        />
      </Screen>
    );
  }

  const title = sourceTitle(source);

  if (result) {
    const percent = Math.max(1, Math.round((1 - result.compressedSize / result.originalSize) * 100));
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
                <Text style={styles.percent}>{percent}% smaller</Text>
              </View>
            ) : null
          }
        >
          <Button
            label="Save to Phone"
            icon="download-outline"
            onPress={() => savePdfWithAd(result.uri, `${title} (compressed)`)}
          />
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

  const onCompress = async () => {
    setBusy(true);
    try {
      setResult(
        source.kind === 'doc'
          ? await compressDocument(source.doc, level)
          : await compressPdf(source.uri, title, level),
      );
    } catch (err) {
      Alert.alert('Compress failed', errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={styles.page}>
      <Text style={styles.sourceName} numberOfLines={1}>{title}</Text>
      <Text style={styles.sourceSub}>
        {source.kind === 'doc' ? pageCount(source.doc.pages.length) : 'PDF from your phone'}
      </Text>

      <Text style={styles.section}>Compression level</Text>
      {COMPRESS_LEVELS.map((l) => {
        const active = l.id === level;
        return (
          <Pressable
            key={l.id}
            onPress={() => setLevel(l.id)}
            disabled={busy}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            style={({ pressed }) => [styles.levelRow, active && styles.levelActive, pressed && styles.pressed]}
          >
            <Ionicons
              name={active ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={active ? colors.primary : colors.textMuted}
            />
            <View style={styles.levelMeta}>
              <Text style={[styles.levelLabel, active && styles.levelLabelActive]}>{l.label}</Text>
              <Text style={styles.levelHint}>{l.hint}</Text>
            </View>
          </Pressable>
        );
      })}
      {source.kind === 'pdf' ? (
        <Text style={styles.note}>Pages are converted to images, so text in the result can’t be selected.</Text>
      ) : null}

      <View style={styles.action}>
        <Button label="Compress" onPress={onCompress} loading={busy} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { padding: spacing.lg },
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
  levelLabelActive: { color: colors.primary },
  levelHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  note: { ...type.caption, marginTop: spacing.xs },
  action: { marginTop: spacing.lg },
  sizeBlock: { alignItems: 'center', marginBottom: spacing.xl },
  sizeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: 4 },
  sizeOld: { fontSize: 16, color: colors.textMuted, textDecorationLine: 'line-through' },
  sizeNew: { fontSize: 22, fontWeight: '800', color: colors.text },
  percent: { fontSize: 14, color: colors.success, fontWeight: '700' },
});
