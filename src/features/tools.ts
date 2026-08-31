import type { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export type ToolStatus = 'ready' | 'soon';
export type ToolAction = 'scan' | 'route' | 'comingSoon';

export interface ToolDef {
  key: string;
  label: string;
  description: string;
  /** Ionicons glyph name. */
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  iconColor: string;
  status: ToolStatus;
  /** Which behaviour the Tools screen wires to this tile. */
  action: ToolAction;
  /** For action: 'route' — the expo-router path to navigate to. */
  route?: string;
}

export interface ToolGroup {
  title: string;
  tools: ToolDef[];
}

/**
 * Single source of truth for the Tools screen.
 *
 * ADDING A FEATURE LATER = add one entry here (+ a handler/route).
 * Set status: 'ready' and point `action` at the new behaviour. Nothing else
 * in the UI needs to change — the grid renders straight from this data.
 */
export const TOOL_GROUPS: ToolGroup[] = [
  {
    title: 'Create',
    tools: [
      {
        key: 'scan',
        label: 'Scan Document',
        description: 'Camera, auto edges, and multi-page capture.',
        icon: 'scan-outline',
        tint: colors.tintTeal,
        iconColor: colors.primary,
        status: 'ready',
        action: 'scan',
      },
      {
        key: 'import-images',
        label: 'Import Images',
        description: 'Bring in photos from your camera roll.',
        icon: 'images-outline',
        tint: colors.tintGreen,
        iconColor: colors.success,
        status: 'soon',
        action: 'comingSoon',
      },
    ],
  },
  {
    title: 'PDF Tools',
    tools: [
      {
        key: 'merge',
        label: 'Merge PDFs',
        description: 'Combine scans and files into one PDF.',
        icon: 'git-merge-outline',
        tint: colors.tintTeal,
        iconColor: colors.primary,
        status: 'ready',
        action: 'route',
        route: '/merge',
      },
      {
        key: 'split',
        label: 'Split PDF',
        description: 'Cut a file into parts, or one page each.',
        icon: 'cut-outline',
        tint: colors.tintOrange,
        iconColor: colors.warning,
        status: 'ready',
        action: 'route',
        route: '/split',
      },
      {
        key: 'compress',
        label: 'Compress',
        description: 'Shrink a PDF without a bigger file.',
        icon: 'archive-outline',
        tint: colors.tintGreen,
        iconColor: colors.success,
        status: 'ready',
        action: 'route',
        route: '/compress',
      },
      {
        key: 'lock',
        label: 'Lock PDF',
        description: 'Password-protect a PDF on this device.',
        icon: 'lock-closed-outline',
        tint: colors.tintPurple,
        iconColor: colors.purple,
        status: 'ready',
        action: 'route',
        route: '/lock',
      },
    ],
  },
  {
    title: 'More',
    tools: [
      {
        key: 'ads',
        label: 'Offers',
        description: 'Sponsored test ads from Google AdMob.',
        icon: 'megaphone-outline',
        tint: colors.tintOrange,
        iconColor: colors.warning,
        status: 'ready',
        action: 'route',
        route: '/ads',
      },
    ],
  },
  {
    title: 'Convert & Extract',
    tools: [
      {
        key: 'to-word',
        label: 'To Word',
        description: 'Turn a scan into an editable document.',
        icon: 'document-outline',
        tint: colors.tintTeal,
        iconColor: colors.primary,
        status: 'soon',
        action: 'comingSoon',
      },
      {
        key: 'extract-text',
        label: 'Extract Text',
        description: 'Copy text off a scanned page.',
        icon: 'text-outline',
        tint: colors.tintOrange,
        iconColor: colors.warning,
        status: 'soon',
        action: 'comingSoon',
      },
    ],
  },
];
