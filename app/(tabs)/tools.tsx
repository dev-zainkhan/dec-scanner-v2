import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TOOL_GROUPS, type ToolDef } from '@/features/tools';
import { useScanToDocument } from '@/hooks/useScanToDocument';
import { PaperCard, Screen, ScreenHeader } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/colors';
import { type } from '@/theme/typography';

export default function ToolsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { scan } = useScanToDocument();

  const scanTool = TOOL_GROUPS.flatMap((g) => g.tools).find((t) => t.key === 'scan');
  const pdfTools = TOOL_GROUPS.find((g) => g.title === 'PDF Tools')?.tools ?? [];
  const moreTools = TOOL_GROUPS.find((g) => g.title === 'More')?.tools ?? [];
  const soonTools = TOOL_GROUPS.flatMap((g) => g.tools).filter((t) => t.status === 'soon');

  const onPressTool = (tool: ToolDef) => {
    if (tool.action === 'scan') {
      scan();
      return;
    }
    if (tool.action === 'route' && tool.route) {
      router.push(tool.route as never);
      return;
    }
    Alert.alert(`${tool.label} — coming soon`, 'This tool is on the way in a future update.');
  };

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <ScreenHeader
          title="Tools"
          subtitle="Everything you can do with your documents"
        />

        {scanTool ? (
          <View style={styles.pad}>
            <Pressable
              onPress={() => onPressTool(scanTool)}
              style={({ pressed }: { pressed: boolean }) => pressed && styles.pressed}
            >
              <PaperCard style={styles.hero}>
                <View style={[styles.heroIcon, { backgroundColor: scanTool.tint }]}>
                  <Ionicons name={scanTool.icon} size={26} color={scanTool.iconColor} />
                </View>
                <View style={styles.heroText}>
                  <Text style={styles.heroTitle}>{scanTool.label}</Text>
                  <Text style={styles.heroDesc}>{scanTool.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </PaperCard>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.section}>PDF tools</Text>
        <View style={styles.grid}>
          {pdfTools.map((tool) => (
            <Pressable
              key={tool.key}
              onPress={() => onPressTool(tool)}
              style={({ pressed }: { pressed: boolean }) => [styles.tile, pressed && styles.pressed]}
            >
              <PaperCard>
                <View style={[styles.tileIcon, { backgroundColor: tool.tint }]}>
                  <Ionicons name={tool.icon} size={24} color={tool.iconColor} />
                </View>
                <Text style={styles.tileLabel}>{tool.label}</Text>
                <Text style={styles.tileDesc} numberOfLines={2}>{tool.description}</Text>
              </PaperCard>
            </Pressable>
          ))}
        </View>

        {moreTools.length > 0 ? (
          <>
            <Text style={styles.section}>More</Text>
            <View style={styles.grid}>
              {moreTools.map((tool) => (
                <Pressable
                  key={tool.key}
                  onPress={() => onPressTool(tool)}
                  style={({ pressed }: { pressed: boolean }) => [styles.tile, pressed && styles.pressed]}
                >
                  <PaperCard>
                    <View style={[styles.tileIcon, { backgroundColor: tool.tint }]}>
                      <Ionicons name={tool.icon} size={24} color={tool.iconColor} />
                    </View>
                    <Text style={styles.tileLabel}>{tool.label}</Text>
                    <Text style={styles.tileDesc} numberOfLines={2}>{tool.description}</Text>
                  </PaperCard>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.section}>Coming soon</Text>
        <View style={styles.grid}>
          {soonTools.map((tool) => (
            <Pressable
              key={tool.key}
              onPress={() => onPressTool(tool)}
              style={({ pressed }: { pressed: boolean }) => [styles.tile, styles.soon, pressed && styles.pressed]}
            >
              <PaperCard>
                <View style={styles.soonRow}>
                  <View style={[styles.tileIconSm, { backgroundColor: tool.tint }]}>
                    <Ionicons name={tool.icon} size={18} color={tool.iconColor} />
                  </View>
                  <View style={styles.soonBadge}>
                    <Text style={styles.soonText}>Soon</Text>
                  </View>
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
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    maxWidth: '48%',
  },
  soon: { opacity: 0.7 },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  tileIconSm: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  tileDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 16 },
  soonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  soonBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  soonText: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.3 },
});
