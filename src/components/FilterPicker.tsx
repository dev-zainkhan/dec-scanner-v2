import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FILTERS } from '@/lib/filters';
import { colors, radius, spacing } from '@/theme/colors';
import type { FilterId } from '@/types';

interface Props {
  value: FilterId;
  onChange: (next: FilterId) => void;
  disabled?: boolean;
}

export function FilterPicker({ value, onChange, disabled }: Props) {
  return (
    <View style={styles.row}>
      {FILTERS.map((f) => {
        const active = f.id === value;
        return (
          <Pressable
            key={f.id}
            disabled={disabled}
            onPress={() => onChange(f.id)}
            style={({ pressed }: { pressed: boolean }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && styles.chipPressed,
              disabled && styles.chipDisabled,
            ]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipPressed: { opacity: 0.7 },
  chipDisabled: { opacity: 0.5 },
  chipText: { fontSize: 13, color: colors.text, fontWeight: '500' },
  chipTextActive: { color: colors.primaryText },
});
