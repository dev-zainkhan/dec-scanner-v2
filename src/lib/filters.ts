import type { FilterId } from '@/types';

// NOTE: Color / B&W filters are temporarily disabled in this fast build because they
// require the native Skia module (a large C++ compile). Only "Original" is active here.
// The full filter set returns in the follow-up build — the public API below is kept
// stable so no screen/component code has to change when Skia comes back.
export const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'original', label: 'Original' },
];

/**
 * No GPU filtering in this build — every page keeps its original (scanner-enhanced)
 * image. Returns the source uri unchanged.
 */
export async function applyFilterToFile(sourceUri: string, _filter: FilterId): Promise<string> {
  return sourceUri;
}
