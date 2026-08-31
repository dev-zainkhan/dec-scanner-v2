import { PDFDocument } from '@cantoo/pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';
import { readAsBase64 } from './storage';

const OUT_DIR = `${FileSystem.documentDirectory}docscanner/pdf/`;

function newId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Password-protects a PDF. Sets both the user password (required to open) and the
 * owner password to the given password, and restricts copying/modifying. Returns
 * the uri of the new encrypted PDF.
 *
 * Relies on a secure crypto.getRandomValues polyfill (loaded in index.ts) for the
 * encryption key/salts.
 */
export async function lockPdf(uri: string, password: string, outName?: string): Promise<string> {
  const doc = await PDFDocument.load(await readAsBase64(uri));
  doc.encrypt({
    userPassword: password,
    ownerPassword: password,
    permissions: { printing: 'highResolution', copying: false, modifying: false },
  });
  const outB64 = await doc.saveAsBase64();

  const dirInfo = await FileSystem.getInfoAsync(OUT_DIR);
  if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(OUT_DIR, { intermediates: true });

  const outUri = `${OUT_DIR}${outName ?? `locked_${newId()}`}.pdf`;
  await FileSystem.writeAsStringAsync(outUri, outB64, { encoding: FileSystem.EncodingType.Base64 });
  return outUri;
}
