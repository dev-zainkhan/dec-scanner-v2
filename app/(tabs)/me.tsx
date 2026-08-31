import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useDocuments } from '@/store/documents';
import { PaperCard, Screen, ScreenHeader } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/colors';
import { type } from '@/theme/typography';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const documents = useDocuments((s) => s.documents);
  const pageCount = documents.reduce((n, d) => n + d.pages.length, 0);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <ScreenHeader title="Settings" subtitle="This copy of DocScanner stays on your phone." />

        <View style={styles.pad}>
          <PaperCard style={styles.identity}>
            <View style={styles.heroIcon}>
              <Ionicons name="scan" size={26} color={colors.primaryText} />
            </View>
            <View>
              <Text style={styles.heroTitle}>DocScanner</Text>
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
              <Text style={styles.statValue}>{pageCount}</Text>
              <Text style={styles.statLabel}>Pages</Text>
            </View>
          </PaperCard>
        </View>

        <Text style={styles.footer}>Everything stays on your device. Nothing is uploaded.</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  section: {
    ...type.section,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  statsRow: { flexDirection: 'row', alignItems: 'stretch' },
  stat: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  statValue: { ...type.display, fontSize: 36 },
  statLabel: { ...type.caption, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  footer: {
    ...type.caption,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
});
