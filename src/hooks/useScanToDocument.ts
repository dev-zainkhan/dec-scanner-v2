import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { scanNewPages } from '@/lib/scanner';
import { useDocuments } from '@/store/documents';

/**
 * Shared "scan -> new document -> open it" flow used by both the Home screen
 * and the Tools grid, so the behaviour stays identical everywhere.
 */
export function useScanToDocument() {
  const router = useRouter();
  const createDocument = useDocuments((s) => s.createDocument);
  const [scanning, setScanning] = useState(false);

  const scan = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    try {
      const pages = await scanNewPages();
      if (pages.length === 0) return; // user cancelled
      const doc = createDocument('', pages);
      router.push({ pathname: '/document/[id]', params: { id: doc.id } });
    } catch (err) {
      Alert.alert('Scan failed', err instanceof Error ? err.message : String(err));
    } finally {
      setScanning(false);
    }
  }, [scanning, createDocument, router]);

  return { scan, scanning };
}
