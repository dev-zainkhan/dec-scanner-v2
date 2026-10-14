# One-time setup on a new Windows machine:  npm run setup
# Checks the toolchain, installs JDK 17 if missing, and installs npm packages.

$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))

function Assert-Command([string]$name, [string]$hint) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) { throw "$name not found. $hint" }
}
Assert-Command node 'Install Node.js LTS from https://nodejs.org'
Assert-Command git 'Install Git from https://git-scm.com'

try {
  . (Join-Path $PSScriptRoot 'env.ps1')
}
catch {
  if ($_.Exception.Message -notmatch 'JDK 17') { throw }
  Write-Host 'Installing JDK 17 (needed by React Native)...'
  winget install --id Microsoft.OpenJDK.17 -e --source winget --accept-package-agreements --accept-source-agreements
  . (Join-Path $PSScriptRoot 'env.ps1')
}

Write-Host "Android SDK: $env:ANDROID_HOME"
Write-Host "JDK:         $env:JAVA_HOME"

$avds = emulator -list-avds | Where-Object { $_ -and $_ -notmatch '^(INFO|WARNING|ERROR)' }
if (-not $avds) { Write-Warning 'No emulator found. Create one in Android Studio > Device Manager.' }
else { Write-Host "Emulators:   $($avds -join ', ')" }

npm install
if ($LASTEXITCODE) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'Setup complete. Start developing with:  npm run dev'
