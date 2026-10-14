import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { scanPages } from '@/lib/scanner';
import { errorMessage } from '@/features/fileActions';
import { useDocuments } from '@/store/documents';

/** Scan → create a document → open it. Shared by the Home and Tools tabs. */
export function useScanToDocument() {
  const router = useRouter();
  const createDocument = useDocuments((s) => s.createDocument);
  const [scanning, setScanning] = useState(false);
  const inFlight = useRef(false);

  const scan = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setScanning(true);
    try {
      const pages = await scanPages();
      if (pages.length === 0) return;
      const doc = createDocument(pages);
      router.push({ pathname: '/document/[id]', params: { id: doc.id } });
    } catch (err) {
      Alert.alert('Scan failed', errorMessage(err));
    } finally {
      inFlight.current = false;
      setScanning(false);
    }
  }, [createDocument, router]);

  return { scan, scanning };
}
