# One-time setup on a new Windows machine:  npm run setup
# Checks the toolchain, downloads a portable JDK 17 into .build-cache if needed,
# and installs npm packages. Nothing new is written to drive C:.

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'  # Invoke-WebRequest is very slow with the progress bar.
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))

function Assert-Command([string]$name, [string]$hint) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) { throw "$name not found. $hint" }
}
Assert-Command node 'Install Node.js LTS from https://nodejs.org'
Assert-Command git 'Install Git from https://git-scm.com'

function Install-PortableJdk {
  $cache = Join-Path (Get-Location) '.build-cache'
  $zip = Join-Path $cache 'tmp\jdk-17.zip'
  $unpacked = Join-Path $cache 'tmp\jdk-17'
  New-Item -ItemType Directory -Force -Path (Split-Path $zip) | Out-Null

  Write-Host 'Downloading JDK 17 (Microsoft Build of OpenJDK, ~190 MB) into .build-cache...'
  Invoke-WebRequest -Uri 'https://aka.ms/download-jdk/microsoft-jdk-17-windows-x64.zip' -OutFile $zip
  if (Test-Path -LiteralPath $unpacked) { Remove-Item -Recurse -Force -LiteralPath $unpacked }
  Expand-Archive -LiteralPath $zip -DestinationPath $unpacked
  # The zip contains one folder such as jdk-17.0.20.1+1; move it to .build-cache\jdk-17.
  $inner = Get-ChildItem -LiteralPath $unpacked -Directory | Select-Object -First 1
  Move-Item -LiteralPath $inner.FullName -Destination (Join-Path $cache 'jdk-17')
  Remove-Item -Force -LiteralPath $zip
  Remove-Item -Recurse -Force -LiteralPath $unpacked
}

try {
  . (Join-Path $PSScriptRoot 'env.ps1')
}
catch {
  if ($_.Exception.Message -notmatch 'JDK 17') { throw }
  Install-PortableJdk
  . (Join-Path $PSScriptRoot 'env.ps1')
}

Write-Host "Android SDK:  $env:ANDROID_HOME"
Write-Host "JDK:          $env:JAVA_HOME"
Write-Host "Gradle cache: $env:GRADLE_USER_HOME"

$avds = emulator -list-avds | Where-Object { $_ -and $_ -notmatch '^(INFO|WARNING|ERROR)' }
if (-not $avds) { Write-Warning 'No emulator found. Create one in Android Studio > Device Manager.' }
else { Write-Host "Emulators:    $($avds -join ', ')" }

npm install
if ($LASTEXITCODE) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'Setup complete. Start developing with:  npm run dev'
