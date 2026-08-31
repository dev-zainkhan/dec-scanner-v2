import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DocumentRecord, Page } from '@/types';
import { deleteFileIfExists } from '@/lib/storage';

interface DocumentsState {
  documents: DocumentRecord[];
  hydrated: boolean;

  createDocument: (title: string, pages: Page[]) => DocumentRecord;
  renameDocument: (id: string, title: string) => void;
  deleteDocument: (id: string) => Promise<void>;

  appendPages: (docId: string, pages: Page[]) => void;
  deletePage: (docId: string, pageId: string) => Promise<void>;
  movePage: (docId: string, pageId: string, direction: -1 | 1) => void;
  updatePage: (docId: string, pageId: string, patch: Partial<Page>) => void;

  getDocument: (id: string) => DocumentRecord | undefined;
}

const now = () => Date.now();

function defaultTitle(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `Scan ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export const useDocuments = create<DocumentsState>()(
  persist(
    (set, get) => ({
      documents: [],
      hydrated: false,

      createDocument: (title, pages) => {
        const doc: DocumentRecord = {
          id: `${now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
          title: title.trim() || defaultTitle(),
          pages,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ documents: [doc, ...s.documents] }));
        return doc;
      },

      renameDocument: (id, title) =>
        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === id ? { ...d, title: title.trim() || d.title, updatedAt: now() } : d,
          ),
        })),

      deleteDocument: async (id) => {
        const doc = get().documents.find((d) => d.id === id);
        if (doc) {
          await Promise.all(
            doc.pages.flatMap((p) => [
              deleteFileIfExists(p.originalUri),
              p.processedUri !== p.originalUri ? deleteFileIfExists(p.processedUri) : Promise.resolve(),
            ]),
          );
        }
        set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }));
      },

      appendPages: (docId, pages) =>
        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === docId ? { ...d, pages: [...d.pages, ...pages], updatedAt: now() } : d,
          ),
        })),

      deletePage: async (docId, pageId) => {
        const doc = get().documents.find((d) => d.id === docId);
        const page = doc?.pages.find((p) => p.id === pageId);
        if (page) {
          await deleteFileIfExists(page.originalUri);
          if (page.processedUri !== page.originalUri) await deleteFileIfExists(page.processedUri);
        }
        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === docId
              ? { ...d, pages: d.pages.filter((p) => p.id !== pageId), updatedAt: now() }
              : d,
          ),
        }));
      },

      movePage: (docId, pageId, direction) =>
        set((s) => ({
          documents: s.documents.map((d) => {
            if (d.id !== docId) return d;
            const i = d.pages.findIndex((p) => p.id === pageId);
            const j = i + direction;
            if (i < 0 || j < 0 || j >= d.pages.length) return d;
            const next = d.pages.slice();
            [next[i], next[j]] = [next[j], next[i]];
            return { ...d, pages: next, updatedAt: now() };
          }),
        })),

      updatePage: (docId, pageId, patch) =>
        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === docId
              ? {
                  ...d,
                  pages: d.pages.map((p) => (p.id === pageId ? { ...p, ...patch } : p)),
                  updatedAt: now(),
                }
              : d,
          ),
        })),

      getDocument: (id) => get().documents.find((d) => d.id === id),
    }),
    {
      name: 'docscanner-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ documents: s.documents }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
