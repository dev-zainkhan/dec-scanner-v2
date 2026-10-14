import DocumentScanner, {
  ResponseType,
  ScanDocumentResponseStatus,
} from 'react-native-document-scanner-plugin';
import { getImageSize, newId, persistPageImage } from './files';
import type { Page } from '@/types';

/**
 * Opens the native scanner (camera, edge detection, cropping, multi-page) and
 * returns the captured pages, already copied into app storage.
 * Returns an empty array if the user cancels.
 */
export async function scanPages(): Promise<Page[]> {
  const result = await DocumentScanner.scanDocument({
    croppedImageQuality: 90,
    responseType: ResponseType.ImageFilePath,
  });
  if (result.status !== ScanDocumentResponseStatus.Success || !result.scannedImages?.length) {
    return [];
  }

  const pages: Page[] = [];
  for (const scanned of result.scannedImages) {
    const uri = await persistPageImage(scanned);
    const { width, height } = await getImageSize(uri);
    pages.push({ id: newId(), uri, width, height, createdAt: Date.now() });
  }
  return pages;
}
