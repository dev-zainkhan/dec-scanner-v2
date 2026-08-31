import * as Sharing from 'expo-sharing';

/**
 * Opens the system share sheet for the given local file uri.
 * Falls back silently if sharing isn't available on the platform.
 */
export async function shareFile(uri: string, mimeType = 'application/pdf'): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) return;
  await Sharing.shareAsync(uri, {
    mimeType,
    dialogTitle: 'Share document',
    UTI: mimeType === 'application/pdf' ? 'com.adobe.pdf' : undefined,
  });
}
