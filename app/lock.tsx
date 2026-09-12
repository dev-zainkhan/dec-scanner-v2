import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useDocuments } from '@/store/documents';
import { exportDocumentToPdf } from '@/lib/pdf';
import { lockPdf } from '@/lib/lock';
import { savePdfToDevice } from '@/lib/save';
import { shareFile } from '@/lib/share';
import { showInterstitialAd } from '@/lib/ads';
import type { DocumentRecord } from '@/types';
import { Button, ResultSuccess, Screen, SourceList, type SourceRow } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/colors';
import { type } from '@/theme/typography';

type Phase = 'pick' | 'password' | 'result';
type Source = { kind: 'doc'; doc: DocumentRecord } | { kind: 'pdf'; uri: string; name: string };

export default function LockScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const documents = useDocuments((s) => s.documents);

  const [phase, setPhase] = useState<Phase>('pick');
  const [source, setSource] = useState<Source | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);

  const name = source ? (source.kind === 'doc' ? source.doc.title : source.name) : '';

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
    setPhase('password');
  };

  const onLock = async () => {
    if (!source || busy) return;
    if (password.length < 1) { Alert.alert('Enter a password'); return; }
    if (password !== confirm) { Alert.alert('Passwords don’t match', 'Please re-enter the same password.'); return; }
    setBusy(true);
    try {
      const srcUri = source.kind === 'doc' ? await exportDocumentToPdf(source.doc) : source.uri;
      const uri = await lockPdf(srcUri, password, `${name} (locked)`);
      setResultUri(uri);
      setPhase('result');
    } catch (err) {
      Alert.alert('Lock failed', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const onSave = async () => {
    if (!resultUri) return;
    try {
      await showInterstitialAd();
      const r = await savePdfToDevice(resultUri, `${name} (locked).pdf`);
      if (r.status === 'saved') Alert.alert('Saved', 'The password-protected PDF was saved to your phone.');
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : String(err));
    }
  };

  if (phase === 'result' && resultUri) {
    return (
      <Screen>
        <ResultSuccess
          icon="lock-closed"
          title="Password protected"
          subtitle="The PDF now requires the password to open. Keep it somewhere safe — it can’t be recovered."
          onDone={() => router.back()}
        >
          <Button label="Save to Phone" icon="download-outline" onPress={onSave} />
          <Button
            label="Share"
            icon="share-social-outline"
            variant="secondary"
            onPress={async () => { await showInterstitialAd(); await shareFile(resultUri, 'application/pdf'); }}
          />
        </ResultSuccess>
      </Screen>
    );
  }

  if (phase === 'password' && source) {
    const mismatch = confirm.length > 0 && password !== confirm;
    return (
      <Screen style={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.lg }}>
        <Text style={styles.sourceName} numberOfLines={1}>{name}</Text>
        <Text style={styles.sourceSub}>Set a password to open this PDF</Text>

        <View style={styles.inputWrap}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!show}
            autoCapitalize="none"
            style={styles.input}
          />
        </View>
        <View style={styles.inputWrap}>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!show}
            autoCapitalize="none"
            style={styles.input}
          />
          <Pressable onPress={() => setShow((s) => !s)} hitSlop={10}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textMuted} />
          </Pressable>
        </View>
        {mismatch && <Text style={styles.errorText}>Passwords don’t match</Text>}

        <View style={{ marginTop: spacing.md }}>
          <Button
            label="Lock PDF"
            icon="lock-closed-outline"
            onPress={onLock}
            disabled={busy || password.length < 1 || password !== confirm}
            loading={busy}
          />
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
          setPhase('password');
        }}
        onImport={onImportPdf}
        importLabel="Lock a PDF from your phone"
        hint="…or pick one of your documents:"
        emptyText="No documents yet — import a PDF from your phone above."
        contentPaddingBottom={insets.bottom + spacing.lg}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sourceName: { ...type.title, fontSize: 20 },
  sourceSub: { ...type.caption, marginTop: 2, marginBottom: spacing.lg, fontSize: 13 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: spacing.md },
  errorText: { color: colors.danger, fontSize: 13, marginBottom: spacing.sm },
});
