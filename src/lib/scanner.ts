import { Image } from 'react-native';
import { persistPageImage } from './storage';
import type { Page } from '@/types';

const SCANNER_MISSING =
  'The camera scanner is not in Expo Go. Build a debug APK (npm run apk:debug) and install that — see README.md.';

function isNativeMissing(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('DocumentScanner') ||
    msg.includes('TurboModuleRegistry') ||
    msg.includes('could not be found')
  );
}

/**
 * Launches the native scanner (camera + auto edge detection + manual corner adjustment
 * + multi-page capture). Returns the new Page records, already persisted to our app storage.
 *
 * Returns an empty array if the user cancels.
 * Loads the native plugin only when Scan is tapped, so Expo Go can still open the UI.
 */
export async function scanNewPages(opts?: { maxPages?: number }): Promise<Page[]> {
  let DocumentScanner: {
    scanDocument: (opts: {
      croppedImageQuality?: number;
      maxNumDocuments?: number;
      responseType?: string;
    }) => Promise<{ status: string; scannedImages?: string[] }>;
  };
  let ResponseType: { ImageFilePath: string };
  let ScanDocumentResponseStatus: { Success: string };

  try {
    const mod = await import('react-native-document-scanner-plugin');
    DocumentScanner = mod.default;
    ResponseType = mod.ResponseType;
    ScanDocumentResponseStatus = mod.ScanDocumentResponseStatus;
  } catch (err) {
    if (isNativeMissing(err)) throw new Error(SCANNER_MISSING);
    throw err;
  }

  if (!DocumentScanner?.scanDocument) {
    throw new Error(SCANNER_MISSING);
  }

  let result: { status: string; scannedImages?: string[] };
  try {
    result = await DocumentScanner.scanDocument({
      croppedImageQuality: 90,
      maxNumDocuments: opts?.maxPages,
      responseType: ResponseType.ImageFilePath,
    });
  } catch (err) {
    if (isNativeMissing(err)) throw new Error(SCANNER_MISSING);
    throw err;
  }

  if (result.status !== ScanDocumentResponseStatus.Success || !result.scannedImages?.length) {
    return [];
  }

  const pages: Page[] = [];
  for (const tmpUri of result.scannedImages) {
    const persisted = await persistPageImage(tmpUri, 'orig');
    const size = await getImageSize(persisted);
    pages.push({
      id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      originalUri: persisted,
      processedUri: persisted,
      filter: 'original',
      width: size.width,
      height: size.height,
      createdAt: Date.now(),
    });
  }
  return pages;
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve({ width: 0, height: 0 }),
    );
  });
}
