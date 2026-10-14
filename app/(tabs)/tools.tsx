import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PDF_TOOLS } from '@/features/tools';
import { useScanToDocument } from '@/hooks/useScanToDocument';
import { PaperCard, Screen, ScreenHeader } from '@/components/ui';
import { colors, radius, spacing, type } from '@/theme';

export default function ToolsScreen() {
  const router = useRouter();
  const { scan, scanning } = useScanToDocument();

  return (
    <Screen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ScreenHeader title="Tools" subtitle="Everything you can do with your documents" />

        <View style={styles.pad}>
          <Pressable
            onPress={scan}
            disabled={scanning}
            accessibilityRole="button"
            style={({ pressed }) => (pressed || scanning) && styles.pressed}
          >
            <PaperCard style={styles.hero}>
              <View style={[styles.heroIcon, { backgroundColor: colors.tintTeal }]}>
                <Ionicons name="scan-outline" size={26} color={colors.primary} />
              </View>
              <View style={styles.heroText}>
                <Text style={styles.heroTitle}>Scan Document</Text>
                <Text style={styles.heroDesc}>Camera, auto edges, and multi-page capture.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </PaperCard>
          </Pressable>
        </View>

        <Text style={styles.section}>PDF tools</Text>
        <View style={styles.grid}>
          {PDF_TOOLS.map((tool) => (
            <Pressable
              key={tool.key}
              onPress={() => router.push(tool.route)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
            >
              <PaperCard style={styles.tileCard}>
                <View style={[styles.tileIcon, { backgroundColor: tool.tint }]}>
                  <Ionicons name={tool.icon} size={24} color={tool.iconColor} />
                </View>
                <Text style={styles.tileLabel}>{tool.label}</Text>
                <Text style={styles.tileDesc} numberOfLines={2}>{tool.description}</Text>
              </PaperCard>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: spacing.xl },
  pad: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  pressed: { opacity: 0.72 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroTitle: { ...type.title, fontSize: 18 },
  heroDesc: { ...type.caption, marginTop: 2 },
  section: {
    ...type.section,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  tile: { flexBasis: '47%', flexGrow: 1, maxWidth: '48%' },
  tileCard: { flex: 1 },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  tileLabel: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  tileDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 16 },
});
