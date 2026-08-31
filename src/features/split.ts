import { exportDocumentToPdf } from '@/lib/pdf';
import type { DocumentRecord } from '@/types';

/** A PDF to split: either an in-app scanned document or an imported PDF file. */
export type SplitSource =
  | { kind: 'doc'; doc: DocumentRecord }
  | { kind: 'pdf'; uri: string; name: string };

/** Resolves a source to a concrete PDF file uri (rendering an in-app document if needed). */
export async function resolveSourcePdf(src: SplitSource): Promise<string> {
  return src.kind === 'doc' ? exportDocumentToPdf(src.doc) : src.uri;
}

export function sourceName(src: SplitSource): string {
  return src.kind === 'doc' ? src.doc.title : src.name;
}
