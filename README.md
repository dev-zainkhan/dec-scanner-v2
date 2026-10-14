# Scanova

Android document scanner and PDF toolkit built with Expo SDK 56, React Native 0.85,
and TypeScript. Scans documents, keeps them on the device, and merges, splits,
compresses, and password-protects PDFs. Ads are served with Google AdMob.

- How the code is organized: [TECHNICAL.md](./TECHNICAL.md)
- Publishing to Google Play (signing, AdMob, Play Console forms): [docs/RELEASE.md](./docs/RELEASE.md)
- Privacy policy source (hosted on GitHub Pages): [docs/privacy-policy.html](./docs/privacy-policy.html)

## One-time setup (Windows)

1. Install [Node.js](https://nodejs.org) (LTS), [Git](https://git-scm.com),
   [Android Studio](https://developer.android.com/studio) (for the Android SDK and
   emulator), and JDK 17:

   ```powershell
   winget install Microsoft.OpenJDK.17
   ```

   React Native needs JDK 17. The JDK bundled with recent Android Studio versions is
   too new and breaks the native build. The scripts find the SDK and JDK 17 automatically.
2. In Android Studio, open **Device Manager** and create a virtual device
   (any recent Pixel with a **Google APIs** or **Google Play** image).
3. In **SDK Manager > SDK Tools**, install **NDK (Side by side)** and **CMake**.
4. Clone into a folder **without spaces** (the Android NDK fails on spaces), then
   run the setup script (checks the tools, installs JDK 17 if missing, runs `npm install`):

   ```powershell
   npm run setup
   ```

5. Open the folder in VS Code and install the recommended extensions when prompted.

## Daily development (live reload on the emulator)

```powershell
npm run dev
```

That one command boots the emulator (if it isn't running), installs the app the
first time (a native build, several minutes), and starts Metro. Edit any `.ts` /
`.tsx` file and save: the app on the emulator updates instantly.

In VS Code you can instead press **Ctrl+Shift+B** (task "Scanova: Dev").

With several emulators, pick one by name (as listed in Android Studio's Device Manager):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/dev.ps1 -Avd Pixel_9_Pro
```

While Metro is running, press **r** in its terminal to reload, or **m** for the
developer menu.

### When you need a native rebuild

Live reload covers JavaScript/TypeScript only. Run a rebuild after you:

- install or update an npm package that has native code,
- change `app.config.ts` (name, package, permissions, plugins),
- see an error like "native module ... not found".

```powershell
npm run dev:rebuild
```

The `android/` folder is generated from `app.config.ts`; never edit it by hand and
don't commit it.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Emulator + install if needed + Metro with live reload |
| `npm run dev:rebuild` | Rebuild and reinstall the native app, then Metro |
| `npm start` | Metro only (the app must already be installed) |
| `npm run typecheck` | TypeScript check |
| `npm run doctor` | Checks Expo config and dependency versions |
| `npm run build:apk` | Release APK to test on a real phone |
| `npm run build:aab` | Signed release bundle for Google Play ([docs/RELEASE.md](./docs/RELEASE.md)) |

## Notes

- Expo Go is **not** supported: the scanner, ads, and PDF rasterizer are native
  modules. Use `npm run dev`, which builds a development app.
- Debug builds always show Google **test** ads. Never click real ads on your own app.
- Camera scanning uses Google Play services' document scanner. On an emulator
  without Google Play services, scanning shows an error; test it on a real phone.
