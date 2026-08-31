# DocScanner - full setup on a new Windows laptop

This file is the only guide you need.

Your laptop can start with NOTHING installed. No Java. No Android Studio. No Node. You only have this project zip.

There are two ways to see the app:

1. Expo Go = quick look at the screens. Camera Scan will not work. Real Google ads will not work.
2. Debug APK = the real app on the phone. Scan works. Test ads work.

Do the install steps first (1 to 8). Then pick Expo Go or APK.

---

## What you will download (once)

| Name | Why |
|---|---|
| Node.js LTS | Runs the JavaScript tools (`npm`, `npx expo`) |
| JDK 17 | Builds the Android app |
| Android Studio | Gives you the Android SDK and `adb` |
| Expo Go app on the phone | Only for the quick UI test |
| USB cable | To put the APK on the phone |

Put the project on a path with NO SPACES.

Good: `D:\fixed-doc-scanner`

Bad: `C:\Users\My Name\Documents\doc scanner`

---

# Part 1 - Install the tools

## Step 1. Install Node.js

1. Open Chrome.
2. Go to https://nodejs.org
3. Download the **LTS** Windows installer (the big left button).
4. Run the installer.
5. Click Next, Next, Install. Leave the boxes as they are.
6. Finish.
7. Close any old PowerShell windows.

Check it worked. Click Start, type `PowerShell`, open it, type:

```powershell
node -v
npm -v
```

You should see numbers like `v22.x.x` and `10.x.x`. If Windows says it is not recognized, restart the PC and try again.

## Step 2. Install Java 17 (JDK)

1. Go to https://adoptium.net/temurin/releases/?version=17
2. Operating system: **Windows**
3. Architecture: **x64** (almost every laptop)
4. Package type: **JDK**
5. Download the `.msi` installer.
6. Run it.
7. On the features page, turn ON **Set JAVA_HOME variable** if you see that option.
8. Install.

Check:

```powershell
java -version
```

You must see **17**. If you see 8 or 21, you installed the wrong version. Uninstall it and install 17.

Find the Java folder. It is often:

`C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`

or

`C:\Program Files\Java\jdk-17`

Copy that full folder path. You need it in Step 6. We will call it YOUR_JAVA_PATH.

## Step 3. Install Android Studio

1. Go to https://developer.android.com/studio
2. Download Android Studio for Windows.
3. Run the installer. Next, Next, Install.
4. Open Android Studio the first time.
5. Choose **Standard** setup if it asks.
6. Let it download the Android SDK. This takes a while. Wait until it finishes.
7. If it asks for a phone emulator, you can skip the emulator. You will use a real phone.

## Step 4. Make sure the Android SDK is installed

1. In Android Studio, click **More Actions** or the three dots, then **SDK Manager**.
   Or: File -> Settings -> Languages & Frameworks -> Android SDK.
2. In the **SDK Platforms** tab, tick a recent Android version (Android 15 / API 35 is fine).
3. In the **SDK Tools** tab, tick:
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - Android SDK Command-line Tools
4. Click Apply. Wait. Click Finish.

The SDK folder is usually:

`C:\Users\YOUR_WINDOWS_USERNAME\AppData\Local\Android\Sdk`

If you cannot see AppData: in File Explorer click View -> Show -> Hidden items.

Copy that full Sdk path. We will call it YOUR_SDK_PATH.

## Step 5. Create two simple folders

Open PowerShell and paste:

```powershell
New-Item -ItemType Directory -Force -Path C:\jtmp
New-Item -ItemType Directory -Force -Path C:\gradle-cache
```

These folders must have **no spaces** in the path. Gradle uses them while building.

## Step 6. Set Windows environment variables

1. Click Start.
2. Type **environment**.
3. Open **Edit the system environment variables**.
4. Click **Environment Variables**.

Under **User variables** (the top box):

**JAVA_HOME**

- New (or Edit if it exists)
- Name: `JAVA_HOME`
- Value: YOUR_JAVA_PATH (the jdk-17 folder, not the bin folder)

**ANDROID_HOME**

- New
- Name: `ANDROID_HOME`
- Value: YOUR_SDK_PATH (the Sdk folder)

**ANDROID_SDK_ROOT**

- New
- Name: `ANDROID_SDK_ROOT`
- Value: the same as ANDROID_HOME

**TMP** and **TEMP**

- Edit both.
- Set them to `C:\jtmp`

**GRADLE_USER_HOME**

- New
- Name: `GRADLE_USER_HOME`
- Value: `C:\gradle-cache`

Now edit **Path** (still in User variables):

- Select Path -> Edit -> New, and add these three lines (use YOUR real paths):

```
YOUR_JAVA_PATH\bin
YOUR_SDK_PATH\platform-tools
YOUR_SDK_PATH\cmdline-tools\latest\bin
```

Click OK on every window.

**Close PowerShell completely.** Open a new PowerShell. Old windows do not see the new variables.

Check:

```powershell
echo $env:JAVA_HOME
echo $env:ANDROID_HOME
java -version
adb version
```

If `adb` is not recognized, the platform-tools Path line is wrong. Fix it and open a new PowerShell.

## Step 7. Unzip this project

1. Copy `DocScanner.zip` to the D: drive if you can.
2. Right click -> Extract All.
3. Extract to: `D:\fixed-doc-scanner`
4. Open that folder. You should see `package.json`, `app`, `src`, `RUN.md`.

If Windows made an extra nested folder (`D:\fixed-doc-scanner\DocScanner\package.json`), move everything up so `package.json` sits directly in `D:\fixed-doc-scanner`.

## Step 8. Install the app's JavaScript packages

Open a **new** PowerShell:

```powershell
cd D:\fixed-doc-scanner
npm install --legacy-peer-deps
```

Wait. The first time can take several minutes. It downloads into `node_modules`. You need internet.

If it fails with `Cannot find module 'babel-preset-expo'`, run:

```powershell
npm install babel-preset-expo --save-dev --legacy-peer-deps
```

You only do Step 8 once per unzip, unless you delete `node_modules`.

---

# Part 2 - Run with Expo Go (screens only)

Use this to see Library, Tools, Settings, and the Offers page layout.

You will NOT get a working camera scan. You will NOT get a real ad banner.

## Step 9. Install Expo Go on the phone

1. On the Android phone, open Play Store.
2. Search **Expo Go**.
3. Install it.
4. It must support **Expo SDK 56**. If the app is very old, update it.

Phone and laptop must be on the **same Wi-Fi**. Turn off VPN on the phone.

## Step 10. Start the project

```powershell
cd D:\fixed-doc-scanner
npx expo start --go --port 8081
```

Wait until a QR code appears in the terminal.

1. Open Expo Go on the phone.
2. Scan that QR code.
3. Wait while it loads. First load is slow.

You should see DocScanner with a paper-colored screen.

Tap **Tools**, then **Offers**. You will see the Offers page and a message that ads need an APK. That is correct.

Tap **Scan**. You will see a message that the camera needs an APK. That is also correct.

To stop: in PowerShell press Ctrl+C.

---

# Part 3 - Build the real APK (Scan + test ads)

Do this after Part 1 is done. Expo Go is not used here.

## Step 11. Turn on USB debugging on the phone

1. On the phone go to Settings -> About phone.
2. Tap **Build number** 7 times until it says you are a developer.
3. Go back. Open **Developer options**.
4. Turn on **USB debugging**.
5. Plug the USB cable into the laptop.
6. On the phone tap **Allow** when it asks to debug.

Check:

```powershell
adb devices
```

You want one line with `device`. If you see `unauthorized`, unlock the phone and allow it.

## Step 12. Build the APK

Open a **new** PowerShell (so JAVA_HOME is set), then paste this whole block.

If your Java or SDK path is different, change the first two lines.

```powershell
cd D:\fixed-doc-scanner

$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-17.0.16+8-hotspot"
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:TMP="C:\jtmp"
$env:TEMP="C:\jtmp"
$env:GRADLE_USER_HOME="C:\gradle-cache"
$env:Path="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin;"+$env:Path

java -version
echo $env:ANDROID_HOME

npx expo prebuild --platform android
cd android
.\gradlew.bat assembleDebug
```

Change the JAVA_HOME line to YOUR_JAVA_PATH.

The first Gradle build can take **10 minutes**. Let it run. Do not close the window.

When it says BUILD SUCCESSFUL, the file is:

```
D:\fixed-doc-scanner\android\app\build\outputs\apk\debug\app-debug.apk
```

If the folder has a slightly different apk name, open that debug folder in Explorer and use the `.apk` you see.

If `npm run apk:debug` works on your copy (after you have the latest scripts), you can use that instead of the long block:

```powershell
cd D:\fixed-doc-scanner
npm run apk:debug
```

## Step 13. Put the APK on the phone

```powershell
adb install -r D:\fixed-doc-scanner\android\app\build\outputs\apk\debug\app-debug.apk
```

Unplug if you want. Open the **DocScanner** icon on the phone. Do not open Expo Go.

Now:

- Tap Scan. The camera / document scanner should open.
- Tap Tools -> Offers. You should see a Google **test** banner. The button can show a full-screen test ad.

These ads are Google's sample ads. They are not your money ads yet.

---

# Part 4 - Ads screen

The app has an **Offers** page.

- Open it: bottom **Tools** tab -> **Offers**
- In Expo Go: the page opens, banner is a placeholder
- In the debug APK: a test banner loads

Test ids (already in the app):

- Android app: `ca-app-pub-3940256099942544~3347511713`
- Banner: `ca-app-pub-3940256099942544/6300978111`

When you have a real AdMob account, replace those values in `app.json` and `src/lib/ads.ts`, then build a new APK.

On Google Play you must tick "Yes, my app contains ads".

---

# If something goes wrong

**`The string is missing the terminator` in env.ps1**

You have an old zip. Copy the new `scripts` folder from the latest zip.

**`node` is not recognized**

Node.js is not installed, or you did not open a new PowerShell after installing.

**`java` is not recognized, or version is not 17**

Install Temurin JDK 17. Set JAVA_HOME. New PowerShell.

**`adb` is not recognized**

Android SDK platform-tools is missing from Path. Step 6.

**`undefined symbol: operator new`**

The project path or the SDK path has a space. Move the project to `D:\fixed-doc-scanner`.

**Unable to establish loopback connection**

TMP and TEMP must be `C:\jtmp` with no spaces. Do not turn the Gradle daemon off.

**Expo Go red error DocumentScanner could not be found**

You opened Scan inside Expo Go, or you are on an old zip. Update to the latest zip. Scan still needs the APK.

**Offers page says ads need an APK**

Build Part 3. Ads are native, like the camera.

**npm install is very slow or fails**

You need internet. Company proxy can block it. Try again, or use a normal home network.

**Phone cannot load the QR**

Same Wi-Fi. VPN off. Windows Firewall may be blocking Node. Allow Node on private networks, or use a phone hotspot and join it from the laptop.
