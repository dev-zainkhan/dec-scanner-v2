# Sets JAVA_HOME / ANDROID_HOME / PATH for Android builds in the current PowerShell session.
# Dot-source it:  . .\scripts\env.ps1
# Detection order: existing env vars, then Android Studio's bundled JDK and default SDK folder.

function Find-FirstPath([string[]]$candidates) {
  foreach ($p in $candidates) { if ($p -and (Test-Path -LiteralPath $p)) { return $p } }
  return $null
}

$sdk = Find-FirstPath @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT, "$env:LOCALAPPDATA\Android\Sdk", 'C:\Android\Sdk')
if (-not $sdk) { throw 'Android SDK not found. Install it with Android Studio (SDK Manager), or set ANDROID_HOME.' }
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk

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

# The Android NDK fails on paths with spaces (C++ modules in this app need it).
$here = (Get-Location).Path
if ($here -match '\s') {
  Write-Warning "Project path contains spaces: $here. Native builds may fail; move the project to a path without spaces."
}
