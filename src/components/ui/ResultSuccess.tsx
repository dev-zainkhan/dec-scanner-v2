import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme/colors';
import { type } from '@/theme/typography';
import { Button } from './Button';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'success' | 'info';
  title: string;
  subtitle?: string;
  detail?: ReactNode;
  children?: ReactNode;
  onDone: () => void;
  doneLabel?: string;
}

export function ResultSuccess({
  icon = 'checkmark',
  tone = 'success',
  title,
  subtitle,
  detail,
  children,
  onDone,
  doneLabel = 'Done',
}: Props) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <View style={[styles.icon, tone === 'info' && styles.iconInfo]}>
        <Ionicons name={icon} size={36} color={colors.primaryText} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {detail}
      {children ? <View style={styles.actions}>{children}</View> : null}
      <Button label={doneLabel} onPress={onDone} variant="ghost" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  icon: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconInfo: { backgroundColor: colors.primary },
  title: { ...type.title, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: {
    ...type.subtitle,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  actions: { width: '100%', gap: spacing.md, marginBottom: spacing.md },
});
