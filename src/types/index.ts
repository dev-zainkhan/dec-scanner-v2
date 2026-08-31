export type FilterId = 'original' | 'color' | 'bw';

export interface Page {
  id: string;
  /** Original scanned image (already cropped by the native scanner). */
  originalUri: string;
  /** Image with the chosen filter baked in. Equals originalUri when filter === 'original'. */
  processedUri: string;
  filter: FilterId;
  width: number;
  height: number;
  createdAt: number;
}

export interface DocumentRecord {
  id: string;
  title: string;
  pages: Page[];
  createdAt: number;
  updatedAt: number;
}
