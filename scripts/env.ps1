# Sets JAVA_HOME / ANDROID_HOME / PATH for Android builds in the current PowerShell session.
# Dot-source it:  . .\scripts\env.ps1
#
# Everything the build downloads or generates (Gradle cache, temp files, npm cache,
# portable JDK) goes into .build-cache\ inside the project, never onto drive C:.
#
# The Android NDK (needed for this app's C++ modules) fails with hundreds of
# "undefined symbol" linker errors when any path it touches contains a space, so:
#   - the project folder itself must not contain spaces,
#   - an SDK under a path with spaces (e.g. C:\Users\Zain Khan\...) is reached through
#     a space-free link in .build-cache\ (a link takes no disk space).

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if ($projectRoot -match '\s') {
  throw "The project folder has a space in its path: '$projectRoot'. Move or clone it to a folder without spaces, e.g. D:\scanova, then delete the node_modules and android folders and run npm run setup again."
}

$buildCache = Join-Path $projectRoot '.build-cache'
foreach ($dir in 'gradle', 'tmp', 'npm') {
  New-Item -ItemType Directory -Force -Path (Join-Path $buildCache $dir) | Out-Null
}
if (-not $env:GRADLE_USER_HOME) { $env:GRADLE_USER_HOME = Join-Path $buildCache 'gradle' }
$env:TMP = Join-Path $buildCache 'tmp'
$env:TEMP = $env:TMP
$env:npm_config_cache = Join-Path $buildCache 'npm'

function Find-FirstPath([string[]]$candidates) {
  foreach ($p in $candidates) { if ($p -and (Test-Path -LiteralPath $p)) { return $p } }
  return $null
}

# --- Android SDK -------------------------------------------------------------
$sdk = Find-FirstPath @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT, "$env:LOCALAPPDATA\Android\Sdk", 'C:\Android\Sdk')
if (-not $sdk) { throw 'Android SDK not found. Install it with Android Studio (SDK Manager), or set ANDROID_HOME.' }

if ($sdk -match '\s') {
  $link = Join-Path $buildCache 'android-sdk'
  if (-not (Test-Path -LiteralPath $link)) {
    # A directory junction needs no admin rights and takes no extra disk space.
    cmd /c mklink /J "$link" "$sdk" | Out-Null
    if (-not (Test-Path -LiteralPath "$link\platform-tools")) { throw "Could not link the Android SDK to $link." }
    Write-Host "Linked Android SDK '$sdk' -> $link (space-free path for the NDK)."
  }
  $sdk = $link
}
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk

# Android Studio may write its own (space-containing) SDK path here, which would win over ANDROID_HOME.
$localProps = Join-Path $projectRoot 'android\local.properties'
if (Test-Path -LiteralPath $localProps) {
  Set-Content -LiteralPath $localProps -Encoding ascii -Value ('sdk.dir=' + ($sdk -replace '\\', '\\'))
}

# --- JDK ---------------------------------------------------------------------
# React Native needs JDK 17 or 21. Newer JDKs (e.g. 25, bundled with recent Android
# Studio) print a native-access warning that fails the CMake step of the build.
function Get-JdkMajor([string]$jdkHome) {
  $release = Join-Path $jdkHome 'release'
  if (-not (Test-Path -LiteralPath $release)) { return 0 }
  $line = Select-String -LiteralPath $release -Pattern '^JAVA_VERSION="(\d+)' | Select-Object -First 1
  if ($line) { return [int]$line.Matches[0].Groups[1].Value } else { return 0 }
}

$jdkCandidates = @((Join-Path $buildCache 'jdk-17'), $env:JAVA_HOME) +
  @(Get-ChildItem -Directory -ErrorAction SilentlyContinue -Path @(
    "$env:ProgramFiles\Microsoft\jdk-*",
    "$env:ProgramFiles\Eclipse Adoptium\jdk-*",
    "$env:ProgramFiles\Java\jdk-*"
  ) | Sort-Object Name -Descending | ForEach-Object FullName) +
  @("$env:ProgramFiles\Android\Android Studio\jbr", "$env:LOCALAPPDATA\Programs\Android Studio\jbr")

$jdk = $jdkCandidates |
  Where-Object { $_ -and (Test-Path -LiteralPath "$_\bin\java.exe") -and ((Get-JdkMajor $_) -in 17, 21) } |
  Select-Object -First 1
if (-not $jdk) {
  throw 'JDK 17 not found. Run  npm run setup  to download it into .build-cache.'
}
$env:JAVA_HOME = $jdk

$env:Path = "$jdk\bin;$sdk\platform-tools;$sdk\emulator;$env:Path"
