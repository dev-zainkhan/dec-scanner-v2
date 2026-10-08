# Start Metro in Expo Go mode.
$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $Root
. (Join-Path $PSScriptRoot 'env.ps1')

if (-not (Test-Path -LiteralPath (Join-Path $Root 'node_modules\expo'))) {
  Write-Error 'node_modules\expo is missing. From the project folder run: npm install --legacy-peer-deps'
  exit 1
}

Write-Host 'Starting Expo Go on port 8081. Scan the QR with Expo Go (SDK 56).'
Write-Host 'Scan will not work in Expo Go. Use the debug APK for camera. See README.md.'
npx expo start --go --port 8081
