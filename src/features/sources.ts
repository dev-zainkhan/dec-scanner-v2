import * as DocumentPicker from 'expo-document-picker';
import { documentToPdf } from '@/lib/pdf';
import { newId } from '@/lib/files';
import { pageCount } from '@/lib/format';
import type { SourceRow } from '@/components/ui';
import type { DocumentRecord } from '@/types';

/** Input for a PDF tool: a scanned document from the library, or a PDF picked from the phone. */
export type PdfSource =
  | { kind: 'doc'; key: string; doc: DocumentRecord }
  | { kind: 'pdf'; key: string; uri: string; name: string };

export function docSource(doc: DocumentRecord): PdfSource {
  return { kind: 'doc', key: `doc:${doc.id}`, doc };
}

export function sourceTitle(source: PdfSource): string {
  return source.kind === 'doc' ? source.doc.title : source.name.replace(/\.pdf$/i, '');
}

/** Returns a PDF file for the source, rendering scanned documents on demand. */
export function sourceToPdf(source: PdfSource): Promise<string> {
  return source.kind === 'doc' ? documentToPdf(source.doc) : Promise.resolve(source.uri);
}

export function sourceRow(source: PdfSource): SourceRow {
  return source.kind === 'doc'
    ? {
        key: source.key,
        title: source.doc.title,
        subtitle: pageCount(source.doc.pages.length),
        coverUri: source.doc.pages[0]?.uri,
      }
    : { key: source.key, title: source.name, subtitle: 'PDF from your phone', icon: 'document-text' };
}

/** Opens the system file picker for PDFs. Returns an empty array if cancelled. */
export async function pickPdfs(multiple = false): Promise<PdfSource[]> {
  const res = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    multiple,
    copyToCacheDirectory: true,
  });
  if (res.canceled) return [];
  return res.assets.map((a) => ({
    kind: 'pdf',
    key: `pdf:${newId()}`,
    uri: a.uri,
    name: a.name || 'document.pdf',
  }));
}
