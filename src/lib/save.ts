import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { readBase64, sanitizeFileName, writeBase64 } from './files';

const SAF = FileSystem.StorageAccessFramework;
const SAVE_DIR_KEY = 'save-dir';

export async function sharePdf(uri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) return;
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share PDF',
    UTI: 'com.adobe.pdf',
  });
}

async function chooseSaveDir(): Promise<string | null> {
  const perm = await SAF.requestDirectoryPermissionsAsync();
  if (!perm.granted) return null;
  await AsyncStorage.setItem(SAVE_DIR_KEY, perm.directoryUri);
  return perm.directoryUri;
}

/**
 * Saves a PDF into a folder the user picks via Android's Storage Access Framework.
 * The folder is remembered so the user only picks it once. Returns false if the
 * user cancelled. Falls back to the share sheet outside Android.
 */
export async function savePdfToDevice(srcUri: string, fileName: string): Promise<boolean> {
  if (Platform.OS !== 'android') {
    await sharePdf(srcUri);
    return true;
  }

  const base64 = await readBase64(srcUri);
  const name = sanitizeFileName(fileName.replace(/\.pdf$/i, ''));
  const write = async (dir: string) =>
    writeBase64(await SAF.createFileAsync(dir, name, 'application/pdf'), base64);

  const remembered = await AsyncStorage.getItem(SAVE_DIR_KEY);
  if (remembered) {
    try {
      await write(remembered);
      return true;
    } catch {
      // Folder access was revoked or the folder was deleted: ask again below.
      await AsyncStorage.removeItem(SAVE_DIR_KEY);
    }
  }

  const dir = await chooseSaveDir();
  if (!dir) return false;
  await write(dir);
  return true;
}
