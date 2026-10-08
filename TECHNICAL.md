# Scanova technical overview

Scanova is an Android-first document scanner built with Expo SDK 56, React
Native 0.85, and TypeScript. Scanning, library storage, and PDF operations run
on the device; the app has no backend service.

For Windows Android SDK/JDK requirements and the verified APK build procedure,
see [README.md](./README.md).

## Technology

| Area | Libraries |
|---|---|
| App and language | Expo `~56.0.12`, React Native `0.85.3`, React `19.2.3`, TypeScript `~6.0.3` |
| Routing and navigation | Expo Router, React Navigation bottom tabs |
| App state | Zustand with AsyncStorage persistence |
| Scanning | `react-native-document-scanner-plugin` (native Android document scanner) |
| PDF creation | `expo-print` renders page images to PDF |
| PDF editing | `pdf-lib` merges/splits; `@cantoo/pdf-lib` encrypts |
| Compression | `expo-image-manipulator`; `react-native-pdf-to-image` rasterizes imported PDFs |
| File access | `expo-file-system/legacy`, `expo-document-picker`, Android Storage Access Framework |
| Sharing | `expo-sharing` |
| Ads | `react-native-google-mobile-ads` (sample/test IDs are configured) |
| UI | Expo vector icons, React Native Gesture Handler, Safe Area Context, React Native Screens |

Dependency versions and build scripts are maintained in [package.json](./package.json)
and [package-lock.json](./package-lock.json).

## App structure

```text
app/
  _layout.tsx             Root navigation stack and shared ad banner
  (tabs)/
    _layout.tsx           Home, Tools, and Settings tabs
    index.tsx             Document library and scan entry point
    tools.tsx             Tool tiles rendered from the tool registry
    me.tsx                Settings/about screen
  document/[id].tsx       Scanned document details and page management
  merge.tsx               Merge PDFs
  split.tsx               Split PDFs
  compress.tsx            Compress PDFs
  lock.tsx                Password-protect PDFs
  ads.tsx                 Offers/test ads
src/
  components/              Reusable UI components
  features/                Tool registry and tool orchestration
  hooks/                   Shared screen flows
  lib/                     Scanning, storage, PDF, sharing, and save operations
  store/                   Persisted documents and user preferences
  theme/                   Shared colors, spacing, and typography
  types/                   Document and page data types
```

## Main application workflows

### Scan and manage documents

1. The Home screen or Tools tab starts the shared `useScanToDocument` flow.
2. `src/lib/scanner.ts` opens the native scanner for camera capture, edge
   detection, cropping, and multi-page scanning.
3. Captured page images are copied into the app's document storage and turned
   into `Page` records.
4. `src/store/documents.ts` creates a `DocumentRecord` and persists the library
   through Zustand's AsyncStorage middleware.
5. The document detail screen previews pages and supports adding, reordering,
   deleting, and exporting them.

`DocumentRecord` contains its ID, title, timestamps, and ordered `Page[]`.
Each page tracks its original and processed image URIs, selected filter,
dimensions, and creation time. Files live in app-private storage under the
`docscanner/` directory; deleting pages or documents also removes their image
files.

The library layout preference (grid or list) is persisted separately in
`src/store/prefs.ts`.

### PDF tools

PDF tools can take either an in-app document or a PDF selected from the phone.
The shared flow is: choose a source, configure the operation, produce a PDF,
then save it to a user-chosen device folder or open the system share sheet.

- **Merge:** converts scanned documents to PDFs as needed, then concatenates
  pages in the chosen order with `pdf-lib`.
- **Split:** writes either two page ranges or one PDF per page with `pdf-lib`.
- **Compress:** re-encodes scanned-page images. Imported PDFs are rasterized
  into images before recompression, so their text may no longer be selectable.
  The size check keeps the original when compression would not reduce it.
- **Lock:** encrypts a PDF using `@cantoo/pdf-lib`.

`src/lib/pdf.ts` creates PDFs from images and scanned documents.
`src/lib/save.ts` uses Android's Storage Access Framework to save files to a
folder selected by the user and remembers that folder. Sharing is handled by
`src/lib/share.ts`.

### Navigation and the tools registry

Expo Router maps files under `app/` to routes. The root stack registers the
document and tool screens; the bottom tab navigator provides Home, Tools, and
Settings. `src/features/tools.ts` is the single source of truth for tool tile
labels, icons, status, and actions. Ready tool routes are also registered in
`app/_layout.tsx`.

## Adding a PDF tool

1. Put reusable PDF logic in `src/lib/`; add orchestration in `src/features/`
   when needed. Reuse existing PDF, save, and share helpers.
2. Add the screen under `app/`, following the existing choose-source,
   configure, and result flow.
3. Register the route in `app/_layout.tsx`.
4. Add or enable its entry in `src/features/tools.ts`.
5. Run `npx tsc --noEmit` and test the tool on an Android build.

Changes that use only JavaScript/TypeScript can be refreshed through Metro.
Adding, removing, or changing a native dependency or native configuration
requires regenerating/rebuilding the Android app before the change is available
on a device. A release APK bundles its JavaScript and does not load live Metro
changes.

## Platform notes and current limitations

- Camera scanning and some PDF operations require the custom native Android
  app; Expo Go does not include these native modules.
- Use `expo-file-system/legacy` for the existing file-system code.
- Only the **Original** page filter is currently implemented. Color and
  black-and-white filter choices are stubs.
- AdMob uses Google's sample test IDs. Replace these with the correct production
  IDs before a production ad release.
- The checked-in Expo config sets Android package `com.docscanner.app` and URL
  scheme `docscanner`.
