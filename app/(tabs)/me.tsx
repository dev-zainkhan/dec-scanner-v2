import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useDocuments } from '@/store/documents';
import { openAdPrivacyOptions, useAds } from '@/lib/ads';
import { errorMessage } from '@/features/fileActions';
import { APP_NAME, PRIVACY_POLICY_URL, SUPPORT_EMAIL } from '@/config/app';
import { PaperCard, Screen, ScreenHeader } from '@/components/ui';
import { colors, radius, spacing, type } from '@/theme';

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

function SettingsRow({ icon, label, onPress }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const openUrl = (url: string) =>
  Linking.openURL(url).catch(() => Alert.alert('Could not open link', url));

export default function SettingsScreen() {
  const documents = useDocuments((s) => s.documents);
  const privacyOptionsRequired = useAds((s) => s.privacyOptionsRequired);
  const pageTotal = documents.reduce((n, d) => n + d.pages.length, 0);
  const version = Constants.expoConfig?.version ?? '';

  const onAdPrivacy = () =>
    openAdPrivacyOptions().catch((err) => Alert.alert('Not available right now', errorMessage(err)));

  return (
    <Screen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ScreenHeader title="Settings" subtitle="Your documents stay on this phone." />

        <View style={styles.pad}>
          <PaperCard style={styles.identity}>
            <View style={styles.heroIcon}>
              <Ionicons name="scan" size={26} color={colors.primaryText} />
            </View>
            <View>
              <Text style={styles.heroTitle}>{APP_NAME}</Text>
              <Text style={styles.heroSub}>Version {version}</Text>
            </View>
          </PaperCard>
        </View>

        <Text style={styles.section}>Library</Text>
        <View style={styles.pad}>
          <PaperCard style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{documents.length}</Text>
              <Text style={styles.statLabel}>Documents</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{pageTotal}</Text>
              <Text style={styles.statLabel}>Pages</Text>
            </View>
          </PaperCard>
        </View>

        <Text style={styles.section}>About</Text>
        <View style={styles.pad}>
          <PaperCard padded={false}>
            <SettingsRow
              icon="shield-checkmark-outline"
              label="Privacy policy"
              onPress={() => openUrl(PRIVACY_POLICY_URL)}
            />
            {privacyOptionsRequired ? (
              <SettingsRow icon="options-outline" label="Ad privacy choices" onPress={onAdPrivacy} />
            ) : null}
            <SettingsRow
              icon="mail-outline"
              label="Contact support"
              onPress={() => openUrl(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${APP_NAME} support`)}`)}
            />
          </PaperCard>
        </View>

        <Text style={styles.footer}>
          Scans and PDFs are processed on your device and are never uploaded.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: spacing.xl },
  pad: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { ...type.title, fontSize: 18 },
  heroSub: { ...type.caption, marginTop: 2 },
  section: { ...type.section, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  statsRow: { flexDirection: 'row', alignItems: 'stretch' },
  stat: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  statValue: { ...type.display, fontSize: 36 },
  statLabel: { ...type.caption, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowLabel: { ...type.body, flex: 1 },
  pressed: { opacity: 0.6 },
  footer: { ...type.caption, textAlign: 'center', paddingHorizontal: spacing.xl },
});
