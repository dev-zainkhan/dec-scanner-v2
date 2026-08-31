# Shared Windows env for Metro and Gradle.
# ASCII only so Windows PowerShell does not choke on UTF-8 dashes.

function Set-DocScannerBuildEnv {
  $jdk = 'C:\Users\He is Back\AppData\Local\Java\jdk-17.0.19+10'
  if (Test-Path -LiteralPath $jdk) {
    $env:JAVA_HOME = $jdk
  }
  elseif ([string]::IsNullOrWhiteSpace($env:JAVA_HOME)) {
    Write-Warning 'JAVA_HOME is not set and the usual JDK 17 path was not found.'
  }

  $sdk = 'C:\Android\Sdk'
  if (Test-Path -LiteralPath $sdk) {
    $env:ANDROID_HOME = $sdk
    $env:ANDROID_SDK_ROOT = $sdk
  }
  elseif ([string]::IsNullOrWhiteSpace($env:ANDROID_HOME)) {
    Write-Warning 'ANDROID_HOME is not set and C:\Android\Sdk was not found.'
  }

  if (Test-Path -LiteralPath 'C:\jtmp') {
    $env:TMP = 'C:\jtmp'
    $env:TEMP = 'C:\jtmp'
  }
  else {
    Write-Warning 'C:\jtmp is missing. If TEMP has spaces, Gradle can fail. Create C:\jtmp or set TMP/TEMP to a path with no spaces.'
  }

  if (Test-Path -LiteralPath 'C:\gradle-cache') {
    $env:GRADLE_USER_HOME = 'C:\gradle-cache'
  }

  $pathPrefix = ''
  if ($env:JAVA_HOME) { $pathPrefix += "$($env:JAVA_HOME)\bin;" }
  if ($env:ANDROID_HOME) {
    $pathPrefix += "$($env:ANDROID_HOME)\platform-tools;$($env:ANDROID_HOME)\cmdline-tools\latest\bin;"
  }
  if ($pathPrefix) { $env:Path = $pathPrefix + $env:Path }

  $here = (Get-Location).Path
  if ($here -match '\s') {
    Write-Warning "Current path has spaces: $here. The Android NDK will likely fail. Use a space-free folder."
  }
}

Set-DocScannerBuildEnv
