#!/usr/bin/env bash
# Kridaz release build (CI / macOS / Linux).
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
#   tools/build_release.sh aab    # Android App Bundle (default)
#   tools/build_release.sh apk    # Android APK
#   tools/build_release.sh ipa    # iOS IPA (macOS only)

set -euo pipefail

target="${1:-aab}"

case "$target" in
    aab|apk|ipa) ;;
    *) echo "Unknown target: $target (expected aab|apk|ipa)" >&2; exit 2 ;;
esac

missing=()
for var in RAZORPAY_KEY_ID CERT_PINS SENTRY_DSN; do
    if [[ -z "${!var:-}" ]]; then
        missing+=("$var")
    fi
done
if [[ ${#missing[@]} -gt 0 ]]; then
    echo "Missing required env vars for release build: ${missing[*]}" >&2
    exit 1
fi

env_name="${ENV:-prod}"
symbols_dir="build/symbols"
mkdir -p "$symbols_dir"

defines=(
    "--dart-define=ENV=$env_name"
    "--dart-define=RAZORPAY_KEY_ID=$RAZORPAY_KEY_ID"
    "--dart-define=CERT_PINS=$CERT_PINS"
    "--dart-define=SENTRY_DSN=$SENTRY_DSN"
)
if [[ -n "${APP_RELEASE:-}" ]]; then
    defines+=("--dart-define=APP_RELEASE=$APP_RELEASE")
fi

hardening=(
    --release
    --obfuscate
    "--split-debug-info=$symbols_dir"
)

case "$target" in
    aab) cmd=(flutter build appbundle "${hardening[@]}" "${defines[@]}") ;;
    apk) cmd=(flutter build apk       "${hardening[@]}" "${defines[@]}") ;;
    ipa) cmd=(flutter build ipa       "${hardening[@]}" "${defines[@]}") ;;
esac

echo "Running: ${cmd[*]}"
"${cmd[@]}"

echo
echo "Build complete. Upload symbols from $symbols_dir to Sentry for symbolicated stack traces."
