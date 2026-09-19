#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/ios"

if command -v swift >/dev/null 2>&1; then
  echo "Running NitroSpeechLogic XCTest via SwiftPM..."
  swift test --package-path "$ROOT/ios"
  exit 0
fi

if command -v xcodebuild >/dev/null 2>&1; then
  echo "Running NitroSpeechLogic XCTest via xcodebuild..."
  xcodebuild test \
    -scheme NitroSpeechLogic \
    -destination "${IOS_NATIVE_DESTINATION:-platform=macOS}"
  exit 0
fi

echo "Neither swift nor xcodebuild is available."
echo "On macOS: xcode-select --install, then rerun: npm run test:ios:native"
exit 1
