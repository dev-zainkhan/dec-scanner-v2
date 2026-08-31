# DocScanner — Project Context & Developer Guide

A CamScanner-style document scanner for Android, built with **Expo SDK 56 / React
Native 0.85 / TypeScript**. This document is the single onboarding reference: read it
top-to-bottom before adding a feature. It explains the architecture, the build setup
(which has several hard-won gotchas), and the exact recipe for adding a new tool.

---

## 1. What the app does

- **Scan** documents with the camera (auto edge detection, manual corner crop, multi-page).
- Manage documents: a persistent **library**, multi-page docs with **add / reorder / delete**.
- **Export to PDF**, **Save to Phone**, and **Share** via the system sheet.
- **PDF tools** that work on in-app scans *and* PDFs imported from the phone:
  **Merge**, **Split**, **Compress**, **Lock** (password-protect).

Everything runs **on-device** — there is no backend server.

---

## 2. Tech stack (exact)

| Area | Choice |
|---|---|
| Framework | Expo SDK `~56`, React Native `0.85.3`, React `19.2.3`, TypeScript |
| Navigation | `expo-router` (file-based) + `@react-navigation/bottom-tabs` |
| State | `zustand` + `@react-native-async-storage/async-storage` (persistence) |
| Files | `expo-file-system` (use the **`/legacy`** API — see §10) |
| Scanner | `react-native-document-scanner-plugin` (Android ML Kit doc scanner) |
| PDF (pages) | `pdf-lib` (merge/split), `expo-print` (images → PDF) |
| PDF (encrypt) | `@cantoo/pdf-lib` (pdf-lib fork w/ encryption) + `react-native-get-random-values` |
| PDF → images | `react-native-pdf-to-image` (native PdfRenderer; for compressing imported PDFs) |
| Image re-encode | `expo-image-manipulator` (compression) |
| Import files | `expo-document-picker` |
| Icons | `@expo/vector-icons` (Ionicons) |

Filters (Color/B&W) are intentionally **stubbed** — see §10.

---

## 3. CRITICAL build environment (read before building)

This project has **non-negotiable path rules** on this Windows machine. Violating them
breaks the native build in confusing ways.

- **No spaces anywhere in the build paths.** RN's NDK clang `.cmd` wrappers drop
  space-containing paths → libc++ link errors (`undefined symbol: operator new`, etc.).
  - Project lives at **`D:\docscanner`** (NOT under `D:\cam Scanner copy\…`).
  - Android SDK at **`C:\Android\Sdk`** (NOT under `C:\Users\He is Back\…`).
- **JDK 17** at `C:\Users\He is Back\AppData\Local\Java\jdk-17.0.19+10` (JAVA_HOME).
  Spaces are tolerated here (Gradle quotes JAVA_HOME) — only the NDK breaks on spaces.
- **`TMP`/`TEMP` must be space-free** (`C:\jtmp`) or the JDK throws
  "Unable to establish loopback connection" during Gradle.
- Gradle cache / global props at **`C:\gradle-cache`** (`GRADLE_USER_HOME`).

**Env block prepended to every build/Metro command (PowerShell):**
```powershell
$env:JAVA_HOME="C:\Users\He is Back\AppData\Local\Java\jdk-17.0.19+10"
$env:ANDROID_HOME="C:\Android\Sdk"; $env:ANDROID_SDK_ROOT="C:\Android\Sdk"
$env:TMP="C:\jtmp"; $env:TEMP="C:\jtmp"
$env:GRADLE_USER_HOME="C:\gradle-cache"
$env:Path="$env:JAVA_HOME\bin;C:\Android\Sdk\platform-tools;C:\Android\Sdk\cmdline-tools\latest\bin;"+$env:Path
```
Do **not** set `org.gradle.daemon=false` (also triggers the loopback bug).

---

## 4. Running & building

Phone: **Infinix X6725 (Android 15)**, adb serial `1491025585006836`.

### Dev (day-to-day, with hot reload)
The app needs native modules, so it runs as a **development build** (a custom APK that
loads JS from Metro), NOT Expo Go.
1. Start Metro: from `D:\docscanner`, `npx expo start --dev-client --port 8081`
2. USB bridge so the phone reaches Metro: `adb reverse tcp:8081 tcp:8081`
3. Launch: `adb shell am start -a android.intent.action.VIEW -d "docscanner://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" com.docscanner.app`
- JS changes hot-reload instantly. **Only a new native module requires a rebuild** (§9).

**Expo Go UI smoke test** (Scan will fail): [EXPO_GO.md](./EXPO_GO.md) — `npm run start:go`

**Debug / release APK**: [APK_BUILD.md](./APK_BUILD.md) — `npm run apk:debug` / `npm run apk:release`

### Rebuild the dev client (after adding a native dependency)
`npx expo run:android` (from `D:\docscanner`, full env). ~4–11 min. Installs to the phone.

### Release APK + AAB (signed) — see `memory/docscanner-release-signing.md`
Signed with the upload keystore at `C:\docscanner-keys\`. From `D:\docscanner\android`:
`gradlew.bat assembleRelease bundleRelease` (set 4 ABIs first for universal; revert to
`arm64-v8a` after). App id `com.docscanner.app`. Bump `versionCode` per Play upload.

> ⚠️ `expo prebuild` regenerates `android/` and **wipes the release signing edit** in
> `android/app/build.gradle`. Re-apply it (details in the signing memory) if that happens.

---

## 5. Project structure

```
app/                          # expo-router routes (screens)
  _layout.tsx                 # root Stack: registers (tabs) + every tool screen
  (tabs)/
    _layout.tsx               # bottom tab bar (Home / Tools / Me)
    index.tsx                 # Home — document library + Scan button
    tools.tsx                 # Tools grid (renders from the registry, §7)
    me.tsx                    # About / library stats
  document/[id].tsx           # Document detail — preview, pages, filters, Save/Share/Delete
  merge.tsx  split.tsx  compress.tsx  lock.tsx   # one screen per PDF tool

src/
  components/                 # DocumentCard, PageThumbnail, FilterPicker
  features/
    tools.ts                  # ★ Tools registry — the grid is data-driven from here
    merge.ts  split.ts        # tool orchestration (source resolution, etc.)
  hooks/useScanToDocument.ts  # shared scan→new-doc→open flow
  lib/                        # the building blocks (see §6)
    scanner.ts  storage.ts  pdf.ts  pdfMerge.ts  pdfSplit.ts
    compress.ts  lock.ts  save.ts  share.ts  filters.ts
  store/documents.ts          # ★ zustand store (documents), AsyncStorage-persisted
  theme/colors.ts             # palette, spacing, radius, shadow tokens
  types/index.ts              # FilterId, Page, DocumentRecord

index.ts                      # entry: imports react-native-get-random-values, then expo-router
app.json                      # expo config, android pkg, scanner camera permission, plugins
```

`android/` and `node_modules/` are git-ignored (android/ is regenerated by prebuild).

---

## 6. Core concepts & reusable building blocks

### Data model (`src/types/index.ts`)
- `DocumentRecord` = `{ id, title, pages: Page[], createdAt, updatedAt }`
- `Page` = `{ id, originalUri, processedUri, filter, width, height, createdAt }`
  - `originalUri` = scanner output; `processedUri` = what's displayed/exported (equals
    original while filters are stubbed). Page image files live in the app document dir.

### Store (`src/store/documents.ts`)
zustand + `persist` (AsyncStorage). Actions: `createDocument`, `renameDocument`,
`deleteDocument`, `appendPages`, `deletePage`, `movePage`, `updatePage`. **Deleting a
doc/page also deletes its image files.** Use `useDocuments((s) => …)` selectors in screens.

### Building blocks in `src/lib` (reuse these in new tools)
- `storage.ts` — `persistPageImage`, `writePageFromBase64`, `readAsBase64`, `deleteFileIfExists`.
- `pdf.ts` — **`exportImagesToPdf(uris, name)`** (images → one PDF) and
  **`exportDocumentToPdf(doc)`**. The go-to for turning pages/images into a PDF.
- `save.ts` — **`savePdfToDevice(uri, fileName)`**: saves to a user-chosen folder via
  Android Storage Access Framework (remembers the folder). Use for every "Save to Phone".
- `share.ts` — **`shareFile(uri, mime)`**: system share sheet.
- `pdfMerge.ts` / `pdfSplit.ts` — pure pdf-lib page operations.
- `scanner.ts` — `scanNewPages()` launches the native scanner, returns persisted `Page[]`.

### Source pattern (used by every PDF tool)
Tools accept a source that is **either an in-app document or an imported PDF**:
```ts
type Source = { kind:'doc'; doc: DocumentRecord } | { kind:'pdf'; uri:string; name:string };
// resolve to a concrete PDF uri:
const pdfUri = source.kind === 'doc' ? await exportDocumentToPdf(source.doc) : source.uri;
```
Imported PDFs come from `expo-document-picker`:
`DocumentPicker.getDocumentAsync({ type:'application/pdf', multiple?, copyToCacheDirectory:true })`.

---

## 7. The Tools system — and HOW TO ADD A TOOL

The **Tools** tab renders entirely from a data registry, so adding a tool needs no UI
surgery. Registry: `src/features/tools.ts` → `TOOL_GROUPS: { title, tools: ToolDef[] }[]`.

```ts
interface ToolDef {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string; iconColor: string;            // from theme colors
  status: 'ready' | 'soon';                   // 'soon' shows a badge + "coming soon" alert
  action: 'scan' | 'route' | 'comingSoon';
  route?: string;                             // for action:'route'
}
```
`app/(tabs)/tools.tsx` maps `action`: `scan` → launches scanner; `route` → `router.push(route)`;
else → "coming soon" alert.

### ✅ Recipe to add a new tool (e.g. "Watermark")
1. **Logic** in `src/lib/watermark.ts` (and `src/features/watermark.ts` if it needs
   orchestration). Reuse `exportImagesToPdf` / pdf-lib / etc.
2. **Screen** `app/watermark.tsx`. Follow the existing pattern: **pick source → options →
   result**, and end on **Save to Phone + Share** (copy from `app/compress.tsx`, the most
   complete example — it handles both doc and imported-PDF sources).
3. **Register the route** in `app/_layout.tsx`:
   `<Stack.Screen name="watermark" options={{ title: 'Watermark' }} />`
4. **Flip the tile** in `src/features/tools.ts`: set the entry to
   `status:'ready', action:'route', route:'/watermark'` (or add a new entry).
5. **Build**: if it uses only JS deps → just save (Metro hot-reloads). If it adds a
   **native** module → `npx expo run:android` to rebuild the dev client (§9).
6. **Verify**: `npx tsc --noEmit`, then test on the phone. Commit.

That's it — no changes to the grid, navigation shell, or store needed.

---

## 8. Implemented tools (reference)

All produce a final PDF with **Save to Phone / Share**. Code lives in `app/<tool>.tsx`
(+ `src/lib` / `src/features`).

| Tool | Sources | How it works |
|---|---|---|
| **Scan** | camera | `scanner.ts` → ML Kit; creates a document, opens it |
| **Merge** (`merge.tsx`, `features/merge.ts`, `lib/pdfMerge.ts`) | docs + imported PDFs | docs → PDF, then pdf-lib concatenates in chosen order |
| **Split** (`split.tsx`, `features/split.ts`, `lib/pdfSplit.ts`) | 1 doc or imported PDF | pdf-lib: split at a page → 2 parts, or 1 file per page |
| **Compress** (`compress.tsx`, `lib/compress.ts`) | docs + imported PDFs | re-encode page images (`expo-image-manipulator`); imported PDFs are rasterized via `react-native-pdf-to-image` first. Size guard keeps original if not smaller |
| **Lock** (`lock.tsx`, `lib/lock.ts`) | docs + imported PDFs | `@cantoo/pdf-lib` `.encrypt()` with the password (Standard handler) |

---

## 9. Native vs JS dependencies (the rebuild rule)

- **JS-only change** (new pure-JS lib, or any `.ts`/`.tsx` edit) → **no rebuild**, Metro
  hot-reloads. Pure-JS deps here: `pdf-lib`, `@cantoo/pdf-lib`, `zustand`, `crypto-js`.
- **New native module** (anything with Android/iOS native code) → **rebuild the dev
  client** with `npx expo run:android`, then reinstall. Native deps here: the scanner,
  `expo-*` modules, `expo-document-picker`, `expo-image-manipulator`,
  `react-native-pdf-to-image`, `react-native-get-random-values`, gesture-handler, screens.
- A new native module also can't be tested by the **release APK on the phone** until you
  rebuild — and remember the release APK is *standalone* (JS baked in), so it never reflects
  Metro changes.

---

## 10. Known gotchas / quirks (don't get bitten)

- **`expo-file-system`**: import the **legacy** API everywhere:
  `import * as FileSystem from 'expo-file-system/legacy'` (documentDirectory,
  read/writeAsStringAsync, etc.). The new default API is different.
- **Filters are stubbed**: `src/lib/filters.ts` returns the source uri and `FILTERS` has
  only `original`. Color/B&W need `@shopify/react-native-skia` re-added (Reanimated, its
  peer, is already in the build). The B&W you see while scanning is the **native ML Kit
  scanner's own** filter, not ours.
- **Reanimated/Worklets oscillate**: `npx expo install` sometimes re-adds
  `react-native-reanimated`/`react-native-worklets`; `npm install --legacy-peer-deps`
  sometimes prunes them. Harmless (nothing imports reanimated; the worklets babel plugin is
  NOT in `babel.config.js`), but it changes build time. If you intentionally use reanimated,
  add `react-native-worklets/plugin` to `babel.config.js` (last).
- **`npm install --legacy-peer-deps` can prune `babel-preset-expo`** → Metro fails with
  "Cannot find module 'babel-preset-expo'". Reinstall it if that happens.
- **`expo prebuild --clean` wipes** `android/gradle.properties` (arch + JVM args) and the
  **release signing** edit in `android/app/build.gradle`. Re-apply after any prebuild.
- **Compressing arbitrary PDFs rasterizes them** (text → image). Great for scans, not ideal
  for text PDFs; the size guard prevents making a file bigger.
- **Cross-drive hard-link warnings** during builds (`Hard link … failed. Doing a slower
  copy instead.`) are benign — gradle cache is on C:, project on D:.

---

## 11. Conventions

- Theme tokens only: `src/theme/colors.ts` (`colors`, `spacing`, `radius`, `shadow`). No
  hardcoded colors/sizes in screens.
- Icons: `@expo/vector-icons` `Ionicons`.
- Tool screens: `pick → options → result`, result has **Save to Phone** (primary) +
  **Share** (secondary) + **Done**. Copy `app/compress.tsx` as the template.
- Keep new capabilities in `src/lib` (pure logic) and keep screens thin.
- Run `npx tsc --noEmit` before committing. Commit per feature with a descriptive message.

---

## 12. More context (AI/agent memory)

Deeper operational notes live in the session memory files (outside the repo):
`memory/docscanner-build-env.md`, `docscanner-mvp-scope.md`, `docscanner-release-signing.md`.
This `CONTEXT.md` is the in-repo source of truth; keep it updated as features land.
