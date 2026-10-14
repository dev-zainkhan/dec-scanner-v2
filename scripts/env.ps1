# Sets JAVA_HOME / ANDROID_HOME / PATH for Android builds in the current PowerShell session.
# Dot-source it:  . .\scripts\env.ps1
#
# The Android NDK (needed for this app's C++ modules) fails with hundreds of
# "undefined symbol" linker errors when any path it touches contains a space.
# This script keeps every build path space-free:
#   - refuses to run from a project folder with spaces,
#   - links an SDK under a path with spaces (e.g. C:\Users\Zain Khan\...) to C:\Android\Sdk,
#   - moves Gradle's cache and temp files to C:\gradle-cache and C:\jtmp when the
#     Windows user folder has a space in it.

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if ($projectRoot -match '\s') {
  throw "The project folder has a space in its path: '$projectRoot'. Move or clone it to a folder without spaces, e.g. D:\scanova, then delete the node_modules and android folders and run npm run setup again."
}

function Find-FirstPath([string[]]$candidates) {
  foreach ($p in $candidates) { if ($p -and (Test-Path -LiteralPath $p)) { return $p } }
  return $null
}

# --- Android SDK -------------------------------------------------------------
$sdk = Find-FirstPath @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT, "$env:LOCALAPPDATA\Android\Sdk", 'C:\Android\Sdk')
if (-not $sdk) { throw 'Android SDK not found. Install it with Android Studio (SDK Manager), or set ANDROID_HOME.' }

if ($sdk -match '\s') {
  $link = 'C:\Android\Sdk'
  if (-not (Test-Path -LiteralPath $link)) {
    New-Item -ItemType Directory -Force -Path (Split-Path $link) | Out-Null
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

# --- Gradle cache and temp files ----------------------------------------------
if ($env:USERPROFILE -match '\s') {
  foreach ($dir in 'C:\gradle-cache', 'C:\jtmp') {
    if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  }
  $env:GRADLE_USER_HOME = 'C:\gradle-cache'
  $env:TMP = 'C:\jtmp'
  $env:TEMP = 'C:\jtmp'
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

$jdkCandidates = @($env:SCANOVA_JAVA_HOME, $env:JAVA_HOME) +
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
  throw 'JDK 17 not found. Install it with:  winget install Microsoft.OpenJDK.17'
}
$env:JAVA_HOME = $jdk

$env:Path = "$jdk\bin;$sdk\platform-tools;$sdk\emulator;$env:Path"
