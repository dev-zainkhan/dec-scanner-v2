import { Image } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

/** Scanned page images. Persistent and private to the app. */
const PAGES_DIR = `${FileSystem.documentDirectory}pages/`;
/** PDFs produced by exports and tools. Temporary: cleared on every app start. */
const EXPORTS_DIR = `${FileSystem.cacheDirectory}exports/`;

export function newId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Makes a string safe to use as a file name on Android. */
export function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'document';
}

async function ensureDir(dir: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
}

export function readBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

export function writeBase64(uri: string, base64: string): Promise<void> {
  return FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
}

/** Best-effort delete; never throws. */
export async function deleteFile(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Cleanup failures are not worth surfacing to the user.
  }
}

export async function fileSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && !info.isDirectory ? info.size : 0;
}

export function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve({ width: 0, height: 0 }),
    );
  });
}

/** Copies a scanner temp image into persistent page storage and returns the new uri. */
export async function persistPageImage(sourceUri: string): Promise<string> {
  await ensureDir(PAGES_DIR);
  const ext = sourceUri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? '';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
  const dest = `${PAGES_DIR}${newId()}.${safeExt}`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

/**
 * Returns a fresh path for an exported PDF. Each export gets its own folder so the
 * file keeps a readable name (shown in the share sheet) without ever colliding.
 */
export async function newExportPath(name: string): Promise<string> {
  const dir = `${EXPORTS_DIR}${newId()}/`;
  await ensureDir(dir);
  return `${dir}${sanitizeFileName(name)}.pdf`;
}

/** Removes PDFs left over from previous sessions. */
export async function clearExports(): Promise<void> {
  await deleteFile(EXPORTS_DIR);
}
