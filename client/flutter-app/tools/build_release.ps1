# Kridaz release build.
#
# Bakes in obfuscation + split debug info and forwards required
# --dart-define values from environment variables.
#
# Required env vars:
#   RAZORPAY_KEY_ID  - Razorpay live (or test) key id
#   CERT_PINS        - comma-separated base64 SHA-256 cert pins
#   SENTRY_DSN       - Sentry project DSN
#
# Optional:
#   APP_RELEASE      - release tag (e.g. "kridaz@1.0.0+42")
#   ENV              - prod | local | emulator   (default: prod)
#
# Usage:
#   pwsh tools/build_release.ps1 aab        # Android App Bundle (default)
#   pwsh tools/build_release.ps1 apk        # Android APK
#   pwsh tools/build_release.ps1 ipa        # iOS IPA (macOS only)

param(
    [ValidateSet('aab', 'apk', 'ipa')]
    [string]$Target = 'aab'
)

$ErrorActionPreference = 'Stop'

# ── Required secrets ──────────────────────────────────────────────────────
$required = @('RAZORPAY_KEY_ID', 'CERT_PINS', 'SENTRY_DSN')
$missing = $required | Where-Object { -not (Get-Item "env:$_" -ErrorAction SilentlyContinue) }
if ($missing.Count -gt 0) {
    Write-Error "Missing required env vars for release build: $($missing -join ', ')"
    exit 1
}

$envName = if ($env:ENV) { $env:ENV } else { 'prod' }
$release = if ($env:APP_RELEASE) { $env:APP_RELEASE } else { '' }

$symbolsDir = 'build/symbols'
New-Item -ItemType Directory -Force -Path $symbolsDir | Out-Null

$defines = @(
    "--dart-define=ENV=$envName",
    "--dart-define=RAZORPAY_KEY_ID=$($env:RAZORPAY_KEY_ID)",
    "--dart-define=CERT_PINS=$($env:CERT_PINS)",
    "--dart-define=SENTRY_DSN=$($env:SENTRY_DSN)"
)
if ($release) { $defines += "--dart-define=APP_RELEASE=$release" }

$hardening = @(
    '--release',
    '--obfuscate',
    "--split-debug-info=$symbolsDir"
)

switch ($Target) {
    'aab' { $cmd = @('flutter', 'build', 'appbundle') + $hardening + $defines }
    'apk' { $cmd = @('flutter', 'build', 'apk')       + $hardening + $defines }
    'ipa' { $cmd = @('flutter', 'build', 'ipa')       + $hardening + $defines }
}

Write-Host "Running: $($cmd -join ' ')"
& $cmd[0] $cmd[1..($cmd.Length - 1)]
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Build complete. Upload symbols from $symbolsDir to Sentry for symbolicated stack traces."
