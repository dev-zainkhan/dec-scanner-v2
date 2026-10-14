import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { PDFDocument } from '@cantoo/pdf-lib';
import { newExportPath, readBase64, writeBase64 } from './files';
import type { DocumentRecord } from '@/types';

export interface PdfPart {
  uri: string;
  label: string;
}

function imageMime(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

/**
 * One image per page, fit-to-page, no margins. Images are inlined as data URIs so
 * the print WebView never reads from disk (avoids Android file:// restrictions).
 */
async function buildPrintHtml(imageUris: string[]): Promise<string> {
  const pages: string[] = [];
  for (const uri of imageUris) {
    pages.push(`<section><img src="data:${imageMime(uri)};base64,${await readBase64(uri)}" /></section>`);
  }
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { margin: 0; }
      html, body { margin: 0; padding: 0; background: #fff; }
      section {
        page-break-after: always;
        width: 100%;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      section:last-child { page-break-after: auto; }
      img { max-width: 100%; max-height: 100%; object-fit: contain; }
    </style>
  </head>
  <body>${pages.join('')}</body>
</html>`;
}

/** Renders image files into a single PDF and returns its uri. */
export async function imagesToPdf(imageUris: string[], name: string): Promise<string> {
  if (imageUris.length === 0) throw new Error('There are no pages to export.');
  const { uri: printed } = await Print.printToFileAsync({ html: await buildPrintHtml(imageUris) });
  const out = await newExportPath(name);
  await FileSystem.moveAsync({ from: printed, to: out });
  return out;
}

export function documentToPdf(doc: DocumentRecord): Promise<string> {
  return imagesToPdf(doc.pages.map((p) => p.uri), doc.title);
}

async function loadPdf(uri: string): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(await readBase64(uri));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/encrypt/i.test(message)) {
      throw new Error('This PDF is password-protected. Remove the password and try again.');
    }
    throw new Error('This file could not be read as a PDF.');
  }
}

async function savePdf(doc: PDFDocument, name: string): Promise<string> {
  const out = await newExportPath(name);
  await writeBase64(out, await doc.saveAsBase64());
  return out;
}

async function copyPages(src: PDFDocument, indices: number[], name: string): Promise<string> {
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  pages.forEach((p) => out.addPage(p));
  return savePdf(out, name);
}

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

export async function getPdfPageCount(uri: string): Promise<number> {
  return (await loadPdf(uri)).getPageCount();
}

/** Concatenates PDFs in the given order. */
export async function mergePdfs(uris: string[], name: string): Promise<string> {
  const merged = await PDFDocument.create();
  for (const uri of uris) {
    const src = await loadPdf(uri);
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  return savePdf(merged, name);
}

/** Splits into pages 1..afterPage and afterPage+1..end (afterPage is 1-based). */
export async function splitPdfInTwo(uri: string, afterPage: number, name: string): Promise<PdfPart[]> {
  const src = await loadPdf(uri);
  const n = src.getPageCount();
  const cut = Math.max(1, Math.min(afterPage, n - 1));
  return [
    { uri: await copyPages(src, range(0, cut - 1), `${name} part 1`), label: `Part 1 · pages 1–${cut}` },
    { uri: await copyPages(src, range(cut, n - 1), `${name} part 2`), label: `Part 2 · pages ${cut + 1}–${n}` },
  ];
}

/** Splits into one PDF per page. */
export async function splitPdfEveryPage(uri: string, name: string): Promise<PdfPart[]> {
  const src = await loadPdf(uri);
  const parts: PdfPart[] = [];
  for (let i = 0; i < src.getPageCount(); i++) {
    parts.push({ uri: await copyPages(src, [i], `${name} page ${i + 1}`), label: `Page ${i + 1}` });
  }
  return parts;
}

/**
 * Encrypts a PDF so the password is required to open it. Relies on the
 * crypto.getRandomValues polyfill loaded in index.ts.
 */
export async function lockPdf(uri: string, password: string, name: string): Promise<string> {
  const doc = await loadPdf(uri);
  doc.encrypt({
    userPassword: password,
    ownerPassword: password,
    permissions: { printing: 'highResolution', copying: false, modifying: false },
  });
  return savePdf(doc, name);
}
