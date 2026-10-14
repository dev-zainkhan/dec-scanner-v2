# PDF & Image Scanner: complete guide

Everything you need, start to finish: set up a Windows laptop, run the app with
live reload, test on your phone, build a Play Store release, and push your work
to GitHub. All commands are for **PowerShell**, run from the project folder
unless noted.

| I want to… | Go to |
|---|---|
| Set up a new laptop | [1. One-time setup](#1-one-time-setup) |
| Work on the app every day | [2. Daily development](#2-daily-development) |
| Test on my real phone | [3. Run on a real phone](#3-run-on-a-real-phone) |
| Publish an update to Google Play | [5. Build a release for Google Play](#5-build-a-release-for-google-play) |
| Save my work to GitHub | [6. Save your work to GitHub](#6-save-your-work-to-github) |
| Fix an error | [7. Troubleshooting](#7-troubleshooting) |
| Free up disk space | [8. Free up disk space](#8-free-up-disk-space) |

---

## 1. One-time setup

### 1.1 Install the tools

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install Google.AndroidStudio
```

Close and reopen PowerShell afterwards so the new commands are found.

You do **not** need to install Java: `npm run setup` downloads the exact JDK
version React Native needs (JDK 17) into the project folder.

### 1.2 Set up Android Studio (once)

1. Open Android Studio and finish its first-run wizard (it installs the Android SDK).
2. **More Actions → SDK Manager → SDK Tools** tab: tick **NDK (Side by side)** and
   **CMake**, then **Apply**.
3. **More Actions → Virtual Device Manager → Create device**: pick a Pixel phone and a
   system image with **Google Play** or **Google APIs**. Note its name (for example
   `Pixel_9_Pro`).

### 1.3 Get the code

Clone into a folder **without spaces** in its path. `D:\scanova` works;
`D:\scanova 2` or `D:\My Projects\scanova` do not (the Android C++ build breaks on
spaces).

```powershell
git clone https://github.com/dev-zainkhan/dec-scanner-v2.git D:\scanova
cd D:\scanova
```

### 1.4 Install everything the project needs

```powershell
npm run setup
```

This checks Node, Git and the Android SDK, downloads JDK 17 into `.build-cache\`
if needed, and runs `npm install`. Everything it downloads stays inside the
project folder, so nothing new goes to drive C:.

### 1.5 Open it in VS Code

```powershell
code .
```

Accept **Install recommended extensions** when VS Code asks.

---

## 2. Daily development

### 2.1 Start the app with live reload

```powershell
npm run dev
```

What happens:

1. Starts your emulator if no device is connected (takes about a minute).
2. The **first time only**: builds and installs the app (10–40 minutes depending
   on the laptop; later runs skip this).
3. Starts **Metro**, the live-reload server, and opens the app.

Now edit any `.ts` / `.tsx` file and press **Ctrl+S**: the app updates on the
device within a second or two.

In VS Code you can press **Ctrl+Shift+B** instead (task **Dev**).

Pick a specific emulator by name:

```powershell
npm run dev -- -Avd Pixel_9_Pro
```

While Metro runs, in its terminal: **r** reloads the app, **m** opens the
developer menu, **Ctrl+C** stops it.

### 2.2 Where to change things

| To change… | Edit |
|---|---|
| Screens | `app\` (e.g. `app\(tabs)\index.tsx` is the Home tab) |
| PDF logic (merge, split, lock…) | `src\lib\pdf.ts` |
| Colors, spacing, fonts | `src\theme\` |
| Tool tiles on the Tools tab | `src\features\tools.ts` |
| App name, package, permissions | `app.config.ts` (needs a rebuild, see 2.4) |
| AdMob IDs | `src\config\admob.json` (needs a rebuild) |
| Privacy policy link, support email | `src\config\app.ts` |

More detail on how the code fits together: [TECHNICAL.md](./TECHNICAL.md).

### 2.3 Check your code before saving it

```powershell
npm run typecheck
```

No output means no errors.

### 2.4 When you need a full rebuild

Live reload only covers TypeScript/JavaScript. Rebuild the native app after you:

- install or update an npm package,
- change `app.config.ts` or `src\config\admob.json`,
- see an error like *"native module … not found"*.

```powershell
npm run dev:rebuild
```

Install a new package the Expo way (it picks a version that matches the SDK),
then rebuild:

```powershell
npx expo install <package-name>
npm run dev:rebuild
```

The `android\` folder is generated from `app.config.ts` on every build. Never
edit it by hand; your changes would be overwritten.

---

## 3. Run on a real phone

The camera scanner needs a real phone (emulators usually can't scan).

1. On the phone: **Settings → About phone** → tap **Build number** 7 times.
2. **Settings → System → Developer options** → turn on **USB debugging**.
3. Connect the phone with a USB data cable and tap **Allow** on the phone
   (tick *Always allow from this computer*).
4. Check that it is connected:

   ```powershell
   . .\scripts\env.ps1
   adb devices
   ```

   You should see your phone with the word `device` (not `unauthorized`).
5. Run the app on it:

   ```powershell
   npm run dev
   ```

   With the phone connected, no emulator is started. The first run builds the
   app for the phone's processor (another long build, once).

Development builds always show Google's **test** ads, so tapping them is safe.
**Never tap real ads** in the Play Store version: AdMob bans accounts for that.

---

## 4. All commands

| Command | What it does |
|---|---|
| `npm run setup` | One-time setup: JDK 17, npm packages |
| `npm run dev` | Device/emulator + install if needed + live reload |
| `npm run dev -- -Avd NAME` | Same, on a specific emulator |
| `npm run dev:rebuild` | Rebuild + reinstall the native app, then live reload |
| `npm start` | Live reload only (app must already be installed) |
| `npm run typecheck` | Check the TypeScript code for errors |
| `npm run doctor` | Check Expo config and package versions |
| `npm run create-upload-key` | Create the Play upload key (once per app, ever) |
| `npm run build:aab` | Signed bundle to upload to Google Play |
| `npm run build:apk` | Release APK to install on a phone for testing |

---

## 5. Build a release for Google Play

### 5.1 Put your upload key in place (new laptop only)

The upload key is **not** in GitHub on purpose. Copy your two backed-up files into
the project folder:

```text
D:\scanova\keys\upload-key.jks
D:\scanova\signing.properties
```

(On the laptop where you created the key they are already there. Never create a
new key for an app that is already on Play.)

### 5.2 Increase the version

In `app.config.ts`:

```ts
version: '1.0.1',       // shown to users; bump for each release
android: {
  versionCode: 2,       // MUST go up by 1 for every upload to Play
```

### 5.3 Build

```powershell
npm run build:aab
```

When it says `BUILD SUCCESSFUL`, the file to upload is:

```text
android\app\build\outputs\bundle\release\app-release.aab
```

The first release build on a laptop takes a long time (it compiles for all four
phone processor types); later ones take a few minutes.

### 5.4 Upload

Play Console → your app → **Test and release** → the track you want (Closed
testing now, **Production** later) → **Create new release** → upload the `.aab` →
release notes → **Next** → **Save** → **Publishing overview** → **Send for review**.

The warning *"There is no deobfuscation file…"* is normal and can be ignored.

Full Play Console and AdMob walkthrough (forms, Data safety answers, testers,
production access): [docs/RELEASE.md](./docs/RELEASE.md).

---

## 6. Save your work to GitHub

All work goes on the **`main`** branch.

### 6.1 Every time you finish a change

```powershell
git status
git add -A
git commit -m "Short description of what you changed"
git push origin main
```

`git status` shows what changed. Secrets and generated files (`keys\`,
`signing.properties`, `android\`, `node_modules\`, `.build-cache\`, `.aab`/`.apk`)
are ignored automatically, so they are never pushed.

### 6.2 Get the latest code (for example on another laptop)

```powershell
git pull origin main
npm install
```

If `package.json` changed, also run `npm run dev:rebuild`.

### 6.3 First push from a new laptop

Git opens a browser window to sign in to GitHub. Sign in as the account that owns
the repository (**dev-zainkhan**). If the laptop is signed in to a different
GitHub account, tell Git which account to use for this repository only:

```powershell
git config credential.https://github.com.username dev-zainkhan
git push origin main
```

Set your name for commits once per laptop:

```powershell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

---

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| Hundreds of `undefined symbol` errors (`ld.lld`) | The project path has a space. Clone to e.g. `D:\scanova`, delete `node_modules` and `android`, run `npm run setup`. |
| `JDK 17 not found` | Run `npm run setup` (downloads it into `.build-cache`). |
| `adb devices` shows `unauthorized` | Unlock the phone and tap **Allow** on the USB debugging prompt; replug the cable if no prompt appears. |
| `No connected devices!` | Phone unplugged or USB debugging off; check `adb devices`. |
| Stuck on *"Starting project…"* | Press Ctrl+C and run `npm run dev` again (it starts Metro in offline mode, which avoids slow-network hangs). |
| App shows *"There was a problem loading the project"* | Metro wasn't ready yet. Wait until the terminal shows *Logs for your project will appear below*, then tap **Reload** on the phone. |
| Icons show as empty boxes | Reload the app once Metro has finished starting (press **r** in the Metro terminal). |
| Phone opens the wrong (old) app | Another installed app uses the same link. Uninstall the old app, or open **PDF & Image Scanner** from the app drawer. |
| `native module … not found` | `npm run dev:rebuild` |
| Changes don't appear | Press **r** in the Metro terminal; if still stale, `npx expo start --dev-client --clear`. |
| `No upload key yet` when building | Copy `keys\upload-key.jks` and `signing.properties` into the project (see 5.1). |
| Play rejects: *version code already used* | Increase `android.versionCode` in `app.config.ts` and rebuild. |
| `git push` says *Permission denied* | You are signed in as the wrong GitHub account; see 6.3. |

---

## 8. Free up disk space

These folders are all re-created automatically when needed:

| Folder | What it is | Typical size |
|---|---|---|
| `android\` | Generated native project and build output | 2–6 GB |
| `.build-cache\` | Gradle cache, temp files, npm cache, JDK 17 | 2–5 GB |
| `node_modules\` | npm packages | ~1 GB |

```powershell
Remove-Item -Recurse -Force android, .build-cache, node_modules
```

To work again afterwards: `npm run setup`, then `npm run dev` (the next build is a
full first build again).

**Never delete** `keys\` or `signing.properties` unless they are backed up
somewhere safe (Google Drive and a USB stick): you need them for every app update.
