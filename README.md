# Scanova (DocScanner)

Scanova is an Android document-scanning app built with Expo SDK 56, React Native
0.85, and TypeScript. It scans documents, stores them on-device, exports PDFs,
and provides PDF merge, split, compress, and lock tools.

For the app architecture, libraries, and feature workflows, see
[TECHNICAL.md](./TECHNICAL.md).

## Requirements for a Windows Android release build

- A Windows 10/11 x64 computer with internet access for the first dependency and
  Gradle downloads.
- Node.js 22.23.3 and npm 10.9.9 (versions used for the verified build).
- JDK 17 (the verified build used Temurin 17.0.20.1).
- Android SDK with Android platform API 36, Android Build Tools 36.0.0, NDK
  27.1.12297006, CMake 3.22.1, Android SDK Command-line Tools, and Platform
  Tools.
- A checkout and Android SDK directory whose paths contain no spaces. The
  project includes native C++ modules; space-containing Windows SDK paths can
  cause Android NDK link failures.
- Space-free temporary and Gradle cache directories. This project uses
  `C:\jtmp` and `C:\gradle-cache`.
- Node dependencies installed from the project root. The project uses Expo
  `~56.0.12` and React Native `0.85.3`; install with the lockfile and
  `--legacy-peer-deps`.

Android Studio is a convenient way to install the Android SDK components, but
the command-line tools are sufficient to run the build once the requirements
above are installed. USB debugging, a connected phone, and `adb` are only
needed if you want to install the APK directly from the computer.

## Build a release APK

Open PowerShell in the project root (the directory containing `package.json`).
If dependencies are not installed yet, run:

```powershell
npm install --legacy-peer-deps
```

Set the build environment to paths that exist on your computer. Adjust
`JAVA_HOME` if JDK 17 is installed elsewhere:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot'
$env:ANDROID_HOME = 'C:\Android\Sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:GRADLE_USER_HOME = 'C:\gradle-cache'
$env:TMP = 'C:\jtmp'
$env:TEMP = 'C:\jtmp'
$env:NODE_ENV = 'production'
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:Path"

New-Item -ItemType Directory -Force -Path $env:TMP, $env:GRADLE_USER_HOME | Out-Null
npm run apk:release
```

The build script uses the existing `android` project when present and generates
it with Expo prebuild if it is missing. Avoid `npx expo prebuild --clean` unless
you intend to regenerate native files: a clean prebuild removes native build
customizations.

After Gradle reports `BUILD SUCCESSFUL`, the APK is written to:

```text
android\app\build\outputs\apk\release\app-release.apk
```

Optional signature check:

```powershell
& "$env:ANDROID_HOME\build-tools\36.0.0\apksigner.bat" verify --verbose `
  "android\app\build\outputs\apk\release\app-release.apk"
```

To install on a USB-connected, authorized Android device:

```powershell
adb install -r "android\app\build\outputs\apk\release\app-release.apk"
```

## Build an unsigned release AAB

In the same configured PowerShell session, build from the Android project:

```powershell
Push-Location .\android
try {
  .\gradlew.bat bundleRelease
} finally {
  Pop-Location
}
```

The bundle is written to:

```text
android\app\build\outputs\bundle\release\app-release.aab
```

This project's generated `android\app\build.gradle` assigns the debug key to the
release build by default. To make a bundle for your own upload key, remove only
`signingConfig signingConfigs.debug` from the **release** block before running
`bundleRelease`. Leave the debug block's signing configuration unchanged. The
resulting AAB is unsigned; sign it with your upload key as described below.
Restore the release signing line if you need to build a locally installable
release APK. `android/` is generated and git-ignored, so inspect its signing
configuration again after regenerating it with Expo prebuild.

## Create an upload key and sign the AAB

Create your upload key once, outside the project directory. The following
command prompts for the keystore password, identity details, and key password;
do not put passwords on the command line:

```powershell
$keystore = Join-Path $env:USERPROFILE 'scanova-upload-key.jks'
& "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -v `
  -keystore $keystore `
  -alias scanova-upload `
  -keyalg RSA -keysize 2048 -validity 10000
```

Back up the keystore securely and keep its passwords in a password manager.
Never commit the keystore or share it. Losing the upload key can prevent future
updates signed with that key.

Sign the unsigned AAB. `jarsigner` prompts for your keystore and key passwords:

```powershell
$bundleDir = Join-Path (Get-Location) 'android\app\build\outputs\bundle\release'
$unsignedAab = Join-Path $bundleDir 'app-release.aab'
$signedAab = Join-Path $bundleDir 'app-release-signed.aab'
& "$env:JAVA_HOME\bin\jarsigner.exe" `
  -sigalg SHA256withRSA -digestalg SHA-256 `
  -keystore $keystore -signedjar $signedAab `
  $unsignedAab scanova-upload
if ($LASTEXITCODE -ne 0) { throw 'AAB signing failed' }
```

Verify the signed bundle before uploading:

```powershell
& "$env:JAVA_HOME\bin\jarsigner.exe" -verify -verbose -certs $signedAab
if ($LASTEXITCODE -ne 0) { throw 'AAB signature verification failed' }
```

Upload the signed AAB to Play Console and enroll in Play App Signing if
prompted. The upload key verifies uploads; Google Play uses the app-signing key
to sign APKs delivered to users.

## APK signing note

The current Gradle release APK uses the default Android **debug** signing
configuration. It is suitable for local testing but not for Play Store upload.
For store distribution, upload the AAB signed with your private upload key.

## Verified build output

A release build completed successfully on October 8, 2026, using the toolchain
listed above. The resulting APK was signature-verified. Its output path is
`android\app\build\outputs\apk\release\app-release.apk`.
