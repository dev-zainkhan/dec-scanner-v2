import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { convertB64 } from 'react-native-pdf-to-image';
import { deleteFile, fileSize, getImageSize, readBase64 } from './files';
import { documentToPdf, imagesToPdf } from './pdf';
import type { DocumentRecord } from '@/types';

export type CompressLevel = 'light' | 'balanced' | 'strong';

export const COMPRESS_LEVELS: { id: CompressLevel; label: string; hint: string }[] = [
  { id: 'light', label: 'Light', hint: 'Best quality, modest savings' },
  { id: 'balanced', label: 'Balanced', hint: 'Recommended — good quality, much smaller' },
  { id: 'strong', label: 'Strong', hint: 'Smallest file, lower quality' },
];

/**
 * maxEdge/quality: how page images are re-encoded.
 * renderWidth: pixel width used when rasterizing pages of an imported PDF.
 */
const SETTINGS: Record<CompressLevel, { maxEdge: number; quality: number; renderWidth: number }> = {
  light: { maxEdge: 2400, quality: 0.7, renderWidth: 1700 },
  balanced: { maxEdge: 1600, quality: 0.55, renderWidth: 1300 },
  strong: { maxEdge: 1200, quality: 0.4, renderWidth: 1000 },
};

export interface CompressResult {
  uri: string;
  originalSize: number;
  compressedSize: number;
  /** False when compression didn't help, in which case the original is kept. */
  gained: boolean;
}

/** Downscales the longer edge and lowers JPEG quality. */
async function compressImage(uri: string, level: CompressLevel): Promise<string> {
  const { maxEdge, quality } = SETTINGS[level];
  const { width, height } = await getImageSize(uri);
  const resize =
    width >= height && width > maxEdge ? { width: maxEdge }
    : height > width && height > maxEdge ? { height: maxEdge }
    : null;
  const result = await manipulateAsync(uri, resize ? [{ resize }] : [], {
    compress: quality,
    format: SaveFormat.JPEG,
  });
  return result.uri;
}

async function rebuildFromImages(imageUris: string[], name: string, level: CompressLevel) {
  const compressed: string[] = [];
  for (const uri of imageUris) compressed.push(await compressImage(uri, level));
  try {
    return await imagesToPdf(compressed, name);
  } finally {
    await Promise.all(compressed.map(deleteFile));
  }
}

async function pickSmaller(originalUri: string, candidateUri: string): Promise<CompressResult> {
  const originalSize = await fileSize(originalUri);
  const compressedSize = await fileSize(candidateUri);
  if (compressedSize > 0 && compressedSize < originalSize) {
    return { uri: candidateUri, originalSize, compressedSize, gained: true };
  }
  await deleteFile(candidateUri);
  return { uri: originalUri, originalSize, compressedSize: originalSize, gained: false };
}

/**
 * Compresses a PDF by rasterizing each page and re-encoding the images.
 * Text in the result is no longer selectable.
 */
export async function compressPdf(uri: string, name: string, level: CompressLevel): Promise<CompressResult> {
  const { outputFiles } = await convertB64(await readBase64(uri), SETTINGS[level].renderWidth);
  const pageImages = (outputFiles ?? []).map((p) => (p.startsWith('file://') ? p : `file://${p}`));
  if (pageImages.length === 0) throw new Error('Could not read the pages of this PDF.');
  try {
    return await pickSmaller(uri, await rebuildFromImages(pageImages, `${name} (compressed)`, level));
  } finally {
    await Promise.all(pageImages.map(deleteFile));
  }
}

/** Compresses a scanned document by re-encoding its page images directly. */
export async function compressDocument(doc: DocumentRecord, level: CompressLevel): Promise<CompressResult> {
  const original = await documentToPdf(doc);
  const pageImages = doc.pages.map((p) => p.uri);
  return pickSmaller(original, await rebuildFromImages(pageImages, `${doc.title} (compressed)`, level));
}
