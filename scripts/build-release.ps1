# Builds a release for Google Play (.aab) or a release APK to install on a phone.
#
#   npm run build:aab   signed bundle to upload to Play Console (needs your upload key)
#   npm run build:apk   release APK for testing on a real phone
param(
  [ValidateSet('aab', 'apk')]
  [string]$Target = 'aab'
)

$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))
. (Join-Path $PSScriptRoot 'env.ps1')

if (-not (Test-Path -LiteralPath 'node_modules\expo')) { throw 'Run npm install first.' }

$gradleProps = Join-Path $env:USERPROFILE '.gradle\gradle.properties'
$hasUploadKey = (Test-Path -LiteralPath $gradleProps) -and
  (Select-String -LiteralPath $gradleProps -Pattern '^\s*SCANOVA_UPLOAD_STORE_FILE\s*=' -Quiet)
if ($Target -eq 'aab' -and -not $hasUploadKey) {
  throw "Upload key not configured in $gradleProps. See docs/RELEASE.md (step 1)."
}

if (Select-String -LiteralPath 'src\config\admob.json' -Pattern '3940256099942544' -Quiet) {
  Write-Warning 'src/config/admob.json still has Google TEST ad IDs. The release will show test ads and earn nothing.'
}

# Regenerate the native project so it matches app.config.ts (version, package, plugins).
npx expo prebuild --platform android --no-install
if ($LASTEXITCODE) { exit $LASTEXITCODE }

$task = if ($Target -eq 'aab') { 'bundleRelease' } else { 'assembleRelease' }
Push-Location android
try {
  .\gradlew.bat $task
  if ($LASTEXITCODE) { exit $LASTEXITCODE }
}
finally {
  Pop-Location
}

$output = if ($Target -eq 'aab') {
  'android\app\build\outputs\bundle\release\app-release.aab'
} else {
  'android\app\build\outputs\apk\release\app-release.apk'
}
Write-Host ''
Write-Host "Built: $output"
if (-not $hasUploadKey) { Write-Host 'Signed with the DEBUG key (fine for testing, not for Play Console).' }
