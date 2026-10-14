import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { lockPdf } from '@/lib/pdf';
import { sourceTitle, sourceToPdf, type PdfSource } from '@/features/sources';
import { errorMessage, savePdfWithAd, sharePdfWithAd } from '@/features/fileActions';
import { SourcePicker } from '@/components/SourcePicker';
import { Button, ResultSuccess, Screen } from '@/components/ui';
import { colors, radius, spacing, type } from '@/theme';

export default function LockScreen() {
  const router = useRouter();
  const [source, setSource] = useState<PdfSource | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);

  if (!source) {
    return (
      <Screen>
        <SourcePicker
          onPick={setSource}
          importLabel="Lock a PDF from your phone"
          hint="…or pick one of your documents:"
        />
      </Screen>
    );
  }

  const title = sourceTitle(source);

  if (resultUri) {
    return (
      <Screen>
        <ResultSuccess
          icon="lock-closed"
          title="Password protected"
          subtitle="The PDF now needs the password to open. Keep it somewhere safe — it can’t be recovered."
          onDone={() => router.back()}
        >
          <Button
            label="Save to Phone"
            icon="download-outline"
            onPress={() => savePdfWithAd(resultUri, `${title} (locked)`)}
          />
          <Button
            label="Share"
            icon="share-social-outline"
            variant="secondary"
            onPress={() => sharePdfWithAd(resultUri)}
          />
        </ResultSuccess>
      </Screen>
    );
  }

  const mismatch = confirm.length > 0 && password !== confirm;
  const canLock = password.length > 0 && password === confirm;

  const onLock = async () => {
    setBusy(true);
    try {
      setResultUri(await lockPdf(await sourceToPdf(source), password, `${title} (locked)`));
    } catch (err) {
      Alert.alert('Lock failed', errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const passwordInput = (value: string, onChange: (v: string) => void, placeholder: string) => (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      secureTextEntry={!showPassword}
      autoCapitalize="none"
      autoCorrect={false}
      style={styles.input}
    />
  );

  return (
    <Screen style={styles.page}>
      <Text style={styles.sourceName} numberOfLines={1}>{title}</Text>
      <Text style={styles.sourceSub}>Set a password to open this PDF</Text>

      <View style={styles.inputWrap}>{passwordInput(password, setPassword, 'Password')}</View>
      <View style={styles.inputWrap}>
        {passwordInput(confirm, setConfirm, 'Confirm password')}
        <Pressable
          onPress={() => setShowPassword((s) => !s)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
        >
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.textMuted} />
        </Pressable>
      </View>
      {mismatch ? <Text style={styles.errorText}>Passwords don’t match</Text> : null}

      <View style={styles.action}>
        <Button label="Lock PDF" icon="lock-closed-outline" onPress={onLock} disabled={!canLock} loading={busy} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { padding: spacing.lg },
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
  action: { marginTop: spacing.md },
});
