import { PDFDocument } from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';

const OUT_DIR = `${FileSystem.documentDirectory}docscanner/pdf/`;

function newId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(OUT_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(OUT_DIR, { intermediates: true });
}

function readB64(uri: string) {
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

/** Writes a subset of pages (by 0-based index) from `src` to a new PDF file. */
async function writeSubset(src: PDFDocument, indices: number[], namePrefix: string): Promise<string> {
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, indices);
  copied.forEach((p) => out.addPage(p));
  const b64 = await out.saveAsBase64();
  await ensureDir();
  const uri = `${OUT_DIR}${namePrefix}_${newId()}.pdf`;
  await FileSystem.writeAsStringAsync(uri, b64, { encoding: FileSystem.EncodingType.Base64 });
  return uri;
}

export interface SplitPart {
  uri: string;
  label: string;
  pages: number;
}

export async function getPdfPageCount(uri: string): Promise<number> {
  const src = await PDFDocument.load(await readB64(uri));
  return src.getPageCount();
}

/** Splits a PDF into two parts: pages 1..afterPage and afterPage+1..end (afterPage is 1-based). */
export async function splitPdfInTwo(uri: string, afterPage: number): Promise<SplitPart[]> {
  const src = await PDFDocument.load(await readB64(uri));
  const n = src.getPageCount();
  const safe = Math.max(1, Math.min(afterPage, n - 1));
  const firstIdx = Array.from({ length: safe }, (_, i) => i);
  const secondIdx = Array.from({ length: n - safe }, (_, i) => i + safe);
  const part1 = await writeSubset(src, firstIdx, 'part1');
  const part2 = await writeSubset(src, secondIdx, 'part2');
  return [
    { uri: part1, label: `Part 1 · pages 1–${safe}`, pages: safe },
    { uri: part2, label: `Part 2 · pages ${safe + 1}–${n}`, pages: n - safe },
  ];
}

/** Splits a PDF into one file per page. */
export async function splitPdfEveryPage(uri: string): Promise<SplitPart[]> {
  const src = await PDFDocument.load(await readB64(uri));
  const n = src.getPageCount();
  const parts: SplitPart[] = [];
  for (let i = 0; i < n; i++) {
    const u = await writeSubset(src, [i], `page${i + 1}`);
    parts.push({ uri: u, label: `Page ${i + 1}`, pages: 1 });
  }
  return parts;
}
