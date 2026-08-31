import * as FileSystem from 'expo-file-system/legacy';

const ROOT = `${FileSystem.documentDirectory}docscanner/`;
const PAGES_DIR = `${ROOT}pages/`;

async function ensureDirs() {
  for (const d of [ROOT, PAGES_DIR]) {
    const info = await FileSystem.getInfoAsync(d);
    if (!info.exists) await FileSystem.makeDirectoryAsync(d, { intermediates: true });
  }
}

function newId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Copy a scanner-produced temp file into our persistent pages directory and return the new uri.
 */
export async function persistPageImage(sourceUri: string, suffix = ''): Promise<string> {
  await ensureDirs();
  const ext = sourceUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
  const dest = `${PAGES_DIR}${newId()}${suffix ? '_' + suffix : ''}.${safeExt}`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

/**
 * Write raw bytes (base64) to a new file in the pages directory.
 */
export async function writePageFromBase64(base64: string, ext = 'jpg'): Promise<string> {
  await ensureDirs();
  const dest = `${PAGES_DIR}${newId()}.${ext}`;
  await FileSystem.writeAsStringAsync(dest, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return dest;
}

export async function readAsBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

export async function deleteFileIfExists(uri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // best-effort cleanup
  }
}

export const Paths = { ROOT, PAGES_DIR };
