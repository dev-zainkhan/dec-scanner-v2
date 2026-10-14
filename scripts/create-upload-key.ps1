# Creates the Google Play upload key once:  npm run create-upload-key
#
# Writes keys\upload-key.jks and signing.properties in the project (both git-ignored).
# BACK BOTH UP (e.g. Google Drive + a USB stick) and keep the password in a password
# manager. Every future update of the app must be signed with this same key.

$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))
. (Join-Path $PSScriptRoot 'env.ps1')

$keystore = 'keys\upload-key.jks'
if (Test-Path -LiteralPath $keystore) {
  throw "$keystore already exists. Never replace an upload key that Play Console already knows."
}

function Read-Plain([string]$prompt) {
  $secure = Read-Host -AsSecureString $prompt
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

$name = Read-Host 'Your name or company (stored in the key certificate)'
if ([string]::IsNullOrWhiteSpace($name)) { $name = 'App Developer' }

do {
  $password = Read-Plain 'Choose a key password (at least 8 characters, no spaces)'
  $confirm = Read-Plain 'Repeat the password'
  $ok = $password.Length -ge 8 -and $password -notmatch '\s' -and $password -eq $confirm
  if (-not $ok) { Write-Warning 'Passwords did not match, were shorter than 8 characters, or contained spaces. Try again.' }
} until ($ok)

New-Item -ItemType Directory -Force -Path 'keys' | Out-Null
& "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -noprompt -storetype PKCS12 `
  -keystore $keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000 `
  -storepass $password -keypass $password -dname "CN=$($name -replace ',', ' ')"
if ($LASTEXITCODE) { throw 'keytool failed.' }

Set-Content -LiteralPath 'signing.properties' -Encoding ascii -Value @(
  '# Play upload key. Never commit or share this file.',
  'storeFile=keys/upload-key.jks',
  "storePassword=$password",
  'keyAlias=upload',
  "keyPassword=$password"
)

Write-Host ''
Write-Host 'Upload key created:'
Write-Host "  $((Resolve-Path $keystore).Path)"
Write-Host "  $((Resolve-Path 'signing.properties').Path)"
Write-Host ''
Write-Host 'BACK UP both files now (cloud + USB) and save the password in a password manager.' -ForegroundColor Yellow
Write-Host 'Without them you cannot publish updates to this app.' -ForegroundColor Yellow
