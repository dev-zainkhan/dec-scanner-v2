export interface Page {
  id: string;
  /** Scanned image, already cropped by the native scanner. */
  uri: string;
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
