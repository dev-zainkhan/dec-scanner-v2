import { PDFDocument } from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';

const OUT_DIR = `${FileSystem.documentDirectory}docscanner/pdf/`;

function newId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Merges multiple PDF files (by file uri) into a single PDF using pdf-lib,
 * preserving the given order. Returns the uri of the new merged PDF.
 *
 * Works on any real PDF — both PDFs exported from in-app scans and PDFs the
 * user imported from their phone.
 */
export async function mergePdfFiles(uris: string[], outName?: string): Promise<string> {
  if (uris.length === 0) throw new Error('No PDFs to merge');

  const merged = await PDFDocument.create();
  for (const uri of uris) {
    const b64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const src = await PDFDocument.load(b64);
    const copied = await merged.copyPages(src, src.getPageIndices());
    copied.forEach((p) => merged.addPage(p));
  }

  const outB64 = await merged.saveAsBase64();
  const dirInfo = await FileSystem.getInfoAsync(OUT_DIR);
  if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(OUT_DIR, { intermediates: true });

  const outUri = `${OUT_DIR}${outName ?? `merged_${newId()}`}.pdf`;
  await FileSystem.writeAsStringAsync(outUri, outB64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return outUri;
}
