import { exportDocumentToPdf } from '@/lib/pdf';
import { mergePdfFiles } from '@/lib/pdfMerge';
import type { DocumentRecord } from '@/types';

/** A single thing to merge: either an in-app scanned document or an imported PDF file. */
export type MergeSource =
  | { kind: 'doc'; key: string; doc: DocumentRecord }
  | { kind: 'pdf'; key: string; uri: string; name: string };

/**
 * Merges the given sources (in order) into one PDF and returns its uri.
 * In-app documents are first rendered to PDF; imported PDFs are used directly;
 * everything is then concatenated with pdf-lib.
 */
export async function mergeSourcesToPdf(
  sources: MergeSource[],
  outName?: string,
): Promise<string> {
  const pdfUris: string[] = [];
  for (const s of sources) {
    if (s.kind === 'doc') {
      pdfUris.push(await exportDocumentToPdf(s.doc));
    } else {
      pdfUris.push(s.uri);
    }
  }
  return mergePdfFiles(pdfUris, outName);
}

/** Default name for a merged PDF, e.g. "Merged 2026-06-24 1530". */
export function defaultMergedName(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `Merged ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}${pad(d.getMinutes())}`;
}
