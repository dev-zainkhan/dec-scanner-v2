# Daily development: boots the emulator if needed, then runs the app with live reload.
#
#   npm run dev            start coding (edits to .ts/.tsx files appear instantly)
#   npm run dev:rebuild    after adding a package, changing app.config.ts, or a native error
param(
  [switch]$Rebuild,
  [string]$Avd
)

$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))
. (Join-Path $PSScriptRoot 'env.ps1')

$package = 'com.zainkhan.pdfimagesscanner'
# Local development needs no Expo servers; skipping their version checks avoids hangs on slow networks.
$env:EXPO_OFFLINE = '1'

if (-not (Test-Path -LiteralPath 'node_modules\expo')) {
  Write-Host 'Installing npm packages...'
  npm install
  if ($LASTEXITCODE) { exit $LASTEXITCODE }
}

function Test-DeviceOnline {
  [bool](adb devices | Select-String "`tdevice$")
}

if (-not (Test-DeviceOnline)) {
  if (-not $Avd) {
    $Avd = emulator -list-avds | Where-Object { $_ -and $_ -notmatch '^(INFO|WARNING|ERROR)' } | Select-Object -First 1
  }
  if (-not $Avd) { throw 'No emulator found. Create one in Android Studio > Device Manager.' }
  Write-Host "Starting emulator '$Avd'..."
  Start-Process -FilePath (Join-Path $env:ANDROID_HOME 'emulator\emulator.exe') -ArgumentList @('-avd', $Avd)
  adb wait-for-device
  while ((adb shell getprop sys.boot_completed 2>$null) -ne '1') { Start-Sleep -Seconds 2 }
  Write-Host 'Emulator is ready.'
}

$installed = [bool](adb shell pm list packages $package | Select-String $package)
if ($Rebuild -or -not $installed) {
  # Compiles the native app, installs it, and starts Metro (first build takes several minutes).
  npx expo run:android
}
else {
  # Native app already installed: just start Metro and open the app with live reload.
  npx expo start --dev-client --android
}
