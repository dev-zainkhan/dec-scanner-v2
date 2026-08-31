import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LibraryLayout = 'grid' | 'list';

interface PrefsState {
  libraryLayout: LibraryLayout;
  setLibraryLayout: (layout: LibraryLayout) => void;
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      libraryLayout: 'grid',
      setLibraryLayout: (libraryLayout) => set({ libraryLayout }),
    }),
    {
      name: 'docscanner-prefs-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
