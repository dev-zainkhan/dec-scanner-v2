import type { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { colors } from '@/theme';

export interface ToolDef {
  key: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  iconColor: string;
  route: Href;
}

/**
 * PDF tiles on the Tools tab. To add a tool: create its screen under app/,
 * then add an entry here.
 */
export const PDF_TOOLS: ToolDef[] = [
  {
    key: 'merge',
    label: 'Merge PDFs',
    description: 'Combine scans and files into one PDF.',
    icon: 'git-merge-outline',
    tint: colors.tintTeal,
    iconColor: colors.primary,
    route: '/merge',
  },
  {
    key: 'split',
    label: 'Split PDF',
    description: 'Cut a file into parts, or one page each.',
    icon: 'cut-outline',
    tint: colors.tintOrange,
    iconColor: colors.warning,
    route: '/split',
  },
  {
    key: 'compress',
    label: 'Compress',
    description: 'Make a PDF smaller to share.',
    icon: 'archive-outline',
    tint: colors.tintGreen,
    iconColor: colors.success,
    route: '/compress',
  },
  {
    key: 'lock',
    label: 'Lock PDF',
    description: 'Password-protect a PDF on this device.',
    icon: 'lock-closed-outline',
    tint: colors.tintPurple,
    iconColor: colors.purple,
    route: '/lock',
  },
];
