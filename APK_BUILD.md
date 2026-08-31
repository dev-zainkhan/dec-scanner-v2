# APK build

The full beginner guide is **RUN.md** (install Java, Android Studio, then build).

After those tools exist, from the project folder:

```powershell
npx expo prebuild --platform android
cd android
.\gradlew.bat assembleDebug
```

Install:

```powershell
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

Do not use `expo prebuild --clean` unless you know you must. It wipes signing edits.

Path must have no spaces. TMP should be `C:\jtmp`. JDK must be 17.
