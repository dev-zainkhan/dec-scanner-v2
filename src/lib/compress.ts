import { Image } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { exportImagesToPdf, exportDocumentToPdf } from './pdf';
import { readAsBase64 } from './storage';
import type { DocumentRecord } from '@/types';

export type CompressLevel = 'light' | 'balanced' | 'strong';

export const COMPRESS_LEVELS: { id: CompressLevel; label: string; hint: string }[] = [
  { id: 'light', label: 'Light', hint: 'Best quality, modest savings' },
  { id: 'balanced', label: 'Balanced', hint: 'Recommended — good quality, much smaller' },
  { id: 'strong', label: 'Strong', hint: 'Smallest file, lower quality' },
];

const SETTINGS: Record<CompressLevel, { maxEdge: number; quality: number; dpi: number }> = {
  light: { maxEdge: 2400, quality: 0.7, dpi: 200 },
  balanced: { maxEdge: 1600, quality: 0.55, dpi: 150 },
  strong: { maxEdge: 1200, quality: 0.4, dpi: 110 },
};

async function fileSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && !info.isDirectory ? (info.size ?? 0) : 0;
}

function normalizeUri(path: string): string {
  if (path.startsWith('file://') || path.startsWith('content://')) return path;
  return `file://${path}`;
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), () => resolve({ width: 0, height: 0 }));
  });
}

/** Re-encodes one image smaller (downscale longer edge + lower JPEG quality). */
async function compressImageFile(uri: string, level: CompressLevel): Promise<string> {
  const { maxEdge, quality } = SETTINGS[level];
  const { width, height } = await getImageSize(uri);
  let actions: { resize: { width?: number; height?: number } }[] = [];
  if (width && height) {
    if (width >= height && width > maxEdge) actions = [{ resize: { width: maxEdge } }];
    else if (height > width && height > maxEdge) actions = [{ resize: { height: maxEdge } }];
  }
  const result = await manipulateAsync(uri, actions, { compress: quality, format: SaveFormat.JPEG });
  return result.uri;
}

export interface CompressResult {
  uri: string;
  originalSize: number;
  compressedSize: number;
  /** false when compression didn't help (we kept the original). */
  gained: boolean;
}

async function rebuildFromImages(imageUris: string[], name: string, level: CompressLevel) {
  const compressed: string[] = [];
  for (const img of imageUris) compressed.push(await compressImageFile(img, level));
  const pdf = await exportImagesToPdf(compressed, name);
  await Promise.all(compressed.map((u) => FileSystem.deleteAsync(u, { idempotent: true }).catch(() => {})));
  return pdf;
}

function finalize(originalUri: string, originalSize: number, candidateUri: string, candidateSize: number): CompressResult {
  if (candidateSize > 0 && candidateSize < originalSize) {
    return { uri: candidateUri, originalSize, compressedSize: candidateSize, gained: true };
  }
  // No improvement (e.g. a text PDF): keep the original, don't pretend.
  FileSystem.deleteAsync(candidateUri, { idempotent: true }).catch(() => {});
  return { uri: originalUri, originalSize, compressedSize: originalSize, gained: false };
}

/** Compress an in-app scanned document (re-encode its page images). */
export async function compressDocument(doc: DocumentRecord, level: CompressLevel): Promise<CompressResult> {
  if (doc.pages.length === 0) throw new Error('Document has no pages');
  const originalPdf = await exportDocumentToPdf(doc);
  const originalSize = await fileSize(originalPdf);
  const compressedPdf = await rebuildFromImages(doc.pages.map((p) => p.processedUri), `${doc.title} (compressed)`, level);
  return finalize(originalPdf, originalSize, compressedPdf, await fileSize(compressedPdf));
}

/** Compress an external/imported PDF by rendering its pages to images, then re-encoding. */
export async function compressPdfFile(uri: string, name: string, level: CompressLevel): Promise<CompressResult> {
  const originalSize = await fileSize(uri);
  const base64 = await readAsBase64(uri);
  let convertB64: (b64: string, dpi: number) => Promise<{ outputFiles?: string[] }>;
  try {
    const mod = await import('react-native-pdf-to-image');
    convertB64 = mod.convertB64;
  } catch {
    throw new Error(
      'Compressing a PDF from the phone needs a custom APK (not Expo Go). Build with npm run apk:debug — see README.md.',
    );
  }
  const res = await convertB64(base64, SETTINGS[level].dpi);
  const pageImages = (res.outputFiles ?? []).map(normalizeUri);
  if (pageImages.length === 0) throw new Error('Could not read the PDF pages');
  const compressedPdf = await rebuildFromImages(pageImages, `${name} (compressed)`, level);
  await Promise.all(pageImages.map((u) => FileSystem.deleteAsync(u, { idempotent: true }).catch(() => {})));
  return finalize(uri, originalSize, compressedPdf, await fileSize(compressedPdf));
}

export function formatBytes(n: number): string {
  if (n <= 0) return '0 KB';
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
