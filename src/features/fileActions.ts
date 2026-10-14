import { Alert } from 'react-native';
import { showInterstitialIfReady } from '@/lib/ads';
import { savePdfToDevice, sharePdf } from '@/lib/save';

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Saves a PDF to the phone, showing an interstitial first if one is already loaded. */
export async function savePdfWithAd(uri: string, fileName: string): Promise<void> {
  try {
    await showInterstitialIfReady();
    if (await savePdfToDevice(uri, fileName)) {
      Alert.alert('Saved', 'The PDF was saved to your phone.');
    }
  } catch (err) {
    Alert.alert('Save failed', errorMessage(err));
  }
}

/** Opens the share sheet, showing an interstitial first if one is already loaded. */
export async function sharePdfWithAd(uri: string): Promise<void> {
  try {
    await showInterstitialIfReady();
    await sharePdf(uri);
  } catch (err) {
    Alert.alert('Share failed', errorMessage(err));
  }
}
