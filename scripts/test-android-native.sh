#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GRADLEW="$ROOT/example/android/gradlew"

if [[ ! -x "$GRADLEW" ]]; then
  echo "Missing Gradle wrapper at $GRADLEW"
  exit 1
fi

if [[ -z "${ANDROID_HOME:-}" && -z "${ANDROID_SDK_ROOT:-}" ]]; then
  for candidate in \
    "$ROOT/tests/android/local.properties" \
    "$ROOT/example/android/local.properties"; do
    if [[ -f "$candidate" ]]; then
      sdk_dir="$(sed -n 's/^sdk.dir=//p' "$candidate" | tail -n1 | tr -d '\\')"
      if [[ -n "$sdk_dir" ]]; then
        export ANDROID_HOME="$sdk_dir"
        export ANDROID_SDK_ROOT="$sdk_dir"
      fi
      break
    fi
  done
fi

if [[ -z "${ANDROID_HOME:-}" && -z "${ANDROID_SDK_ROOT:-}" ]]; then
  echo "Android SDK not detected. Set ANDROID_HOME or add tests/android/local.properties with sdk.dir=..."
fi

echo "Running NitroSpeech Android unit tests (Robolectric)..."
"$GRADLEW" -p "$ROOT/tests/android" testDebugUnitTest --stacktrace
