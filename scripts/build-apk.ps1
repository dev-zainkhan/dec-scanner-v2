# Build a local Android APK.
param(
  [ValidateSet('debug', 'release')]
  [string]$Variant = 'debug',
  [switch]$SkipPrebuild
)

$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $Root
. (Join-Path $PSScriptRoot 'env.ps1')

if (-not (Test-Path -LiteralPath (Join-Path $Root 'node_modules\expo'))) {
  Write-Error 'node_modules\expo is missing. From the project folder run: npm install --legacy-peer-deps'
  exit 1
}

$androidDir = Join-Path $Root 'android'
if (-not $SkipPrebuild) {
  if (-not (Test-Path -LiteralPath $androidDir)) {
    Write-Host 'android/ is missing. Running expo prebuild (no --clean)...'
    npx expo prebuild --platform android
  }
  else {
    Write-Host 'android/ already exists. Skipping prebuild.'
  }
}

if (-not (Test-Path -LiteralPath (Join-Path $androidDir 'gradlew.bat'))) {
  Write-Error 'android/gradlew.bat not found. Run without -SkipPrebuild so prebuild can generate the Android project.'
  exit 1
}

$task = if ($Variant -eq 'release') { 'assembleRelease' } else { 'assembleDebug' }
Write-Host "Gradle $task (often 4-11 min)..."
Push-Location $androidDir
try {
  & .\gradlew.bat $task
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
  Pop-Location
}

$apkDir = Join-Path $androidDir "app\build\outputs\apk\$Variant"
Write-Host ''
Write-Host "Done. APK folder: $apkDir"
if (Test-Path -LiteralPath $apkDir) {
  Get-ChildItem -LiteralPath $apkDir -Filter *.apk -Recurse | ForEach-Object { Write-Host "  $($_.FullName)" }
}
Write-Host 'Install: adb install -r <apk>'
Write-Host 'Steps: RUN.md'
