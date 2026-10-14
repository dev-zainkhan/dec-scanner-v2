import { type ReactElement } from 'react';
import { Alert } from 'react-native';
import { useDocuments } from '@/store/documents';
import { docSource, pickPdfs, sourceRow, type PdfSource } from '@/features/sources';
import { errorMessage } from '@/features/fileActions';
import { SourceList } from '@/components/ui';

interface Props {
  onPick: (source: PdfSource) => void;
  importLabel: string;
  hint: string;
  listHeader?: ReactElement | null;
}

/** First step of the single-file tools: pick a library document or a PDF from the phone. */
export function SourcePicker({ onPick, importLabel, hint, listHeader }: Props) {
  const sources = useDocuments((s) => s.documents).map(docSource);

  const onImport = async () => {
    try {
      const [picked] = await pickPdfs();
      if (picked) onPick(picked);
    } catch (err) {
      Alert.alert('Could not open file', errorMessage(err));
    }
  };

  return (
    <SourceList
      items={sources.map(sourceRow)}
      onPressItem={(row) => {
        const source = sources.find((s) => s.key === row.key);
        if (source) onPick(source);
      }}
      onImport={onImport}
      importLabel={importLabel}
      hint={hint}
      emptyText="No documents yet — choose a PDF from your phone above."
      listHeader={listHeader}
    />
  );
}
