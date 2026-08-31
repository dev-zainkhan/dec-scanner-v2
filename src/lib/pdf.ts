import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { readAsBase64 } from './storage';
import type { DocumentRecord } from '@/types';

const OUT_DIR = `${FileSystem.documentDirectory}docscanner/pdf/`;

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'document';
}

/**
 * Builds print HTML from a list of image uris — one image per page, fit-to-page,
 * no margins. Images are embedded as base64 data URIs so the print WebView never
 * reads from disk (avoids Android file:// restrictions).
 */
async function buildHtmlFromImages(uris: string[]): Promise<string> {
  const blocks: string[] = [];
  for (const uri of uris) {
    const b64 = await readAsBase64(uri);
    blocks.push(`<section><img src="data:image/jpeg;base64,${b64}" /></section>`);
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
  <body>${blocks.join('')}</body>
</html>`;
}

/** Renders a list of image files into a single PDF and returns its uri. */
export async function exportImagesToPdf(uris: string[], name: string): Promise<string> {
  if (uris.length === 0) throw new Error('No images to export');

  const html = await buildHtmlFromImages(uris);
  const { uri: tmpUri } = await Print.printToFileAsync({ html, base64: false });

  const dirInfo = await FileSystem.getInfoAsync(OUT_DIR);
  if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(OUT_DIR, { intermediates: true });

  const outUri = `${OUT_DIR}${sanitizeFileName(name)}.pdf`;
  const existing = await FileSystem.getInfoAsync(outUri);
  if (existing.exists) await FileSystem.deleteAsync(outUri, { idempotent: true });

  await FileSystem.moveAsync({ from: tmpUri, to: outUri });
  return outUri;
}

/** Generates a PDF for the given document (from its processed page images). */
export async function exportDocumentToPdf(doc: DocumentRecord): Promise<string> {
  if (doc.pages.length === 0) throw new Error('Document has no pages');
  return exportImagesToPdf(doc.pages.map((p) => p.processedUri), doc.title);
}
