import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme/colors';
import { type } from '@/theme/typography';
import { Button } from './Button';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
}

export function EmptyState({
  icon = 'documents-outline',
  title,
  body,
  actionLabel,
  onAction,
  actionLoading,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={36} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button
            label={actionLabel}
            onPress={onAction}
            icon="scan"
            loading={actionLoading}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: spacing.xl,
  },
  icon: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.tintTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...type.title, textAlign: 'center', marginBottom: spacing.sm },
  body: { ...type.subtitle, textAlign: 'center', lineHeight: 20 },
  action: { marginTop: spacing.xl, alignSelf: 'stretch' },
});
