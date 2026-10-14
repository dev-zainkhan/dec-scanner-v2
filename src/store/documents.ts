import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteFile, newId } from '@/lib/files';
import { timestamp } from '@/lib/format';
import type { DocumentRecord, Page } from '@/types';

interface DocumentsState {
  documents: DocumentRecord[];
  createDocument: (pages: Page[]) => DocumentRecord;
  renameDocument: (id: string, title: string) => void;
  deleteDocument: (id: string) => Promise<void>;
  appendPages: (docId: string, pages: Page[]) => void;
  deletePage: (docId: string, pageId: string) => Promise<void>;
  movePage: (docId: string, pageId: string, direction: -1 | 1) => void;
}

export const useDocuments = create<DocumentsState>()(
  persist(
    (set, get) => {
      const updateDoc = (id: string, update: (doc: DocumentRecord) => DocumentRecord) =>
        set((s) => ({
          documents: s.documents.map((d) => (d.id === id ? { ...update(d), updatedAt: Date.now() } : d)),
        }));

      return {
        documents: [],

        createDocument: (pages) => {
          const now = Date.now();
          const doc: DocumentRecord = {
            id: newId(),
            title: `Scan ${timestamp()}`,
            pages,
            createdAt: now,
            updatedAt: now,
          };
          set((s) => ({ documents: [doc, ...s.documents] }));
          return doc;
        },

        renameDocument: (id, title) => {
          const trimmed = title.trim();
          if (trimmed) updateDoc(id, (d) => ({ ...d, title: trimmed }));
        },

        deleteDocument: async (id) => {
          const doc = get().documents.find((d) => d.id === id);
          await Promise.all(doc?.pages.map((p) => deleteFile(p.uri)) ?? []);
          set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }));
        },

        appendPages: (docId, pages) => updateDoc(docId, (d) => ({ ...d, pages: [...d.pages, ...pages] })),

        deletePage: async (docId, pageId) => {
          const page = get().documents.find((d) => d.id === docId)?.pages.find((p) => p.id === pageId);
          if (page) await deleteFile(page.uri);
          updateDoc(docId, (d) => ({ ...d, pages: d.pages.filter((p) => p.id !== pageId) }));
        },

        movePage: (docId, pageId, direction) =>
          updateDoc(docId, (d) => {
            const i = d.pages.findIndex((p) => p.id === pageId);
            const j = i + direction;
            if (i < 0 || j < 0 || j >= d.pages.length) return d;
            const pages = d.pages.slice();
            [pages[i], pages[j]] = [pages[j], pages[i]];
            return { ...d, pages };
          }),
      };
    },
    {
      name: 'documents',
      // Bump and add a `migrate` function whenever the persisted shape changes.
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ documents: s.documents }),
    },
  ),
);
