# PDF & Image Scanner: technical overview

Android-first document scanner built with Expo SDK 56 (React Native 0.85,
TypeScript, Expo Router). Everything runs on the device; there is no backend.

## Libraries

| Area | Library |
|---|---|
| Navigation | Expo Router (file-based), bottom tabs |
| State | Zustand, persisted to AsyncStorage |
| Scanning | `react-native-document-scanner-plugin` (Google ML Kit document scanner) |
| Images â†’ PDF | `expo-print` (HTML with inlined images) |
| PDF editing | `@cantoo/pdf-lib` (merge, split, encrypt) |
| PDF â†’ images | `react-native-pdf-to-image` (used by Compress for imported PDFs) |
| Image re-encoding | `expo-image-manipulator` |
| Files | `expo-file-system/legacy`, `expo-document-picker`, Storage Access Framework |
| Ads | `react-native-google-mobile-ads` (AdMob + UMP consent) |
| Dev builds | `expo-dev-client` |

## Layout

```text
app/                         Screens (Expo Router: file path = route)
  _layout.tsx                Root stack, ad banner, app start-up (ads, temp cleanup)
  (tabs)/index.tsx           Library (Home)
  (tabs)/tools.tsx           Scan + PDF tool tiles
  (tabs)/me.tsx              Settings: stats, privacy policy, ad privacy choices
  document/[id].tsx          Document detail: pages, reorder, rename, save, share
  merge.tsx split.tsx compress.tsx lock.tsx    PDF tools
src/
  config/admob.json          AdMob app + ad unit IDs (the only place to change them)
  config/app.ts              Privacy policy URL, support email
  lib/                       Platform logic, no UI
    files.ts                 Paths, ids, base64 I/O, temp export files
    pdf.ts                   Imagesâ†’PDF, merge, split, lock, page count
    compress.ts              Compression levels and pipeline
    scanner.ts               Native scanner â†’ Page[]
    save.ts                  Save to a user-picked folder (SAF), share sheet
    ads.ts                   Consent, SDK start, banner IDs, interstitial preloading
    format.ts                Page counts, sizes, dates
  features/                  Logic shared by several screens
    sources.ts               PdfSource (library doc | picked PDF) helpers
    fileActions.ts           Save/share with interstitial + user-facing errors
    tools.ts                 Tool tile registry for the Tools tab
  components/                Reusable UI (ui/ holds the design-system primitives)
  hooks/useScanToDocument.ts Scan â†’ new document â†’ open it
  store/                     documents.ts (library), prefs.ts (layout)
  theme/                     Colors, spacing, radius, typography
  types/                     DocumentRecord, Page
plugins/withReleaseSigning.js  Wires the Play upload key into release builds
scripts/                     dev.ps1, build-release.ps1, env.ps1
```

`@/` is an alias for `src/`.

## Data and storage

- `DocumentRecord { id, title, pages[], createdAt, updatedAt }`;
  `Page { id, uri, width, height, createdAt }`.
- Page images live in `<documentDirectory>/pages/`. Deleting a page or
  document deletes its files.
- The library is persisted under AsyncStorage key `documents`
  (schema `version: 1`). Bump the version and add a `migrate` function
  whenever the stored shape changes.
- Every exported/tool PDF is written to its own folder under
  `<cacheDirectory>/exports/` (unique path, readable file name). The folder is
  cleared on each app start, so temporary PDFs never pile up.

## Flows

**Scan.** `useScanToDocument` â†’ `scanPages()` opens the native scanner, copies the
images into app storage, `createDocument()` stores them, and the app navigates to
the document screen.

**PDF tools.** Each tool takes a `PdfSource` (a library document or a picked PDF).
`SourcePicker` handles that first step for single-file tools; Merge uses
`SourceList` in multi-select mode. `sourceToPdf()` renders library documents to PDF
on demand. Results are shown with `ResultSuccess`, and saved or shared through
`savePdfWithAd` / `sharePdfWithAd`.

**Compress.** Library documents: page images are downscaled and re-encoded, then
rebuilt into a PDF. Imported PDFs: pages are rasterized at a fixed pixel width,
then re-encoded the same way (text stops being selectable). If the result isn't
smaller, the original is kept.

**Save.** The first save asks the user to pick a folder (Storage Access Framework);
it's remembered. If access is later revoked, the user is asked again automatically.

**Ads.** On start-up `startAds()` gathers consent (UMP), initializes the SDK only
if ads may be requested, and preloads an interstitial. `showInterstitialIfReady()`
shows it only if already loaded and at least 90 s passed since the last one;
otherwise it returns immediately, so saving/sharing never waits on the network.
The banner takes no space until an ad has loaded. Debug builds always use test IDs.

**Safe area.** `AppShell` in `app/_layout.tsx` pads the bottom once (for the
system navigation bar) and places the banner above it. Screens see a bottom inset
of 0, so they don't add their own bottom padding.

## Adding a PDF tool

1. Put the PDF logic in `src/lib/pdf.ts` (or a new `src/lib/` file).
2. Add `app/<tool>.tsx`: `SourcePicker` â†’ options â†’ `ResultSuccess` with
   `savePdfWithAd` / `sharePdfWithAd`.
3. Register the screen title in `app/_layout.tsx` and add a tile in
   `src/features/tools.ts`.
4. `npm run typecheck`, then test on the emulator.

New native packages need `npm run dev:rebuild` before they work.
