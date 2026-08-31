import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { shareFile } from './share';

const DIR_KEY = 'docscanner-save-dir-uri-v1';

export type SaveResult =
  | { status: 'saved'; uri: string }
  | { status: 'cancelled' }
  | { status: 'shared' };

/**
 * Saves a local PDF to a user-chosen folder on the phone using Android's Storage
 * Access Framework. The chosen folder is remembered, so the user only picks once
 * (e.g. "Downloads"). On iOS or if SAF is unavailable, falls back to the share sheet.
 */
export async function savePdfToDevice(srcUri: string, fileName: string): Promise<SaveResult> {
  const SAF = (FileSystem as any).StorageAccessFramework;
  if (Platform.OS !== 'android' || !SAF) {
    await shareFile(srcUri, 'application/pdf');
    return { status: 'shared' };
  }

  let dirUri = await AsyncStorage.getItem(DIR_KEY);
  if (!dirUri) {
    const perm = await SAF.requestDirectoryPermissionsAsync();
    if (!perm.granted) return { status: 'cancelled' };
    dirUri = perm.directoryUri as string;
    await AsyncStorage.setItem(DIR_KEY, dirUri);
  }

  const base64 = await FileSystem.readAsStringAsync(srcUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const baseName = fileName.replace(/[\\/:*?"<>|]+/g, '_').replace(/\.pdf$/i, '');

  try {
    const fileUri = await SAF.createFileAsync(dirUri, baseName, 'application/pdf');
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return { status: 'saved', uri: fileUri };
  } catch (e) {
    // The remembered folder may have been revoked/deleted — forget it so the
    // next attempt re-prompts, then surface the error.
    await AsyncStorage.removeItem(DIR_KEY);
    throw e;
  }
}
