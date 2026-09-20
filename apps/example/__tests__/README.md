# NitroSpeech tests

Four layers. Writing tests is enough for this branch — run them locally with the commands below.

## 1. JS unit (Jest)

Pure JS. No emulator.

```bash
npm test
# or
npm --prefix apps/example test
```

Covers `ErrorDictionary` completeness vs 4.10 codes (including optional `onError` trace), `PermissionStatus`, volume/active helpers, `RecognizerRef` method mapping, and a render smoke test of the listen UI.

## 2. JS on-device integration (react-native-harness)

Runs inside the debug app on emulator/simulator.

```bash
npm run test:harness:android   # default
npm run test:harness:ios       # simulator only
```

| File | Coverage |
|------|----------|
| `nitrospeech.permissions.harness.ts` | `getPermissions`, enum |
| `nitrospeech.lifecycle.harness.ts` | start/stop, `getIsActive`, volume, auto-finish progress |
| `nitrospeech.android-emulator.android.harness.ts` | Android ≤3s start→stop, no silence timeout |
| `nitrospeech.ios-simulator.ios.harness.ts` | iOS extended silence must not fail; locales; prewarm |
| `nitrospeech.errors.harness.ts` | error dictionary + unsupported locale + optional `onError` trace |
| `nitrospeech.on-device.harness.ts` | service availability, locales, `onDevice: 'prefer'` |
| `nitrospeech.session-helpers.harness.ts` | idle volume/timer/config, prewarm, iOS locales array |

iOS runner is an **iOS Simulator**. There is no physical-device / team-id path.

## 3. Native unit iOS (XCTest)

Swift package at `ios/` (target `NitroSpeechLogicTests`). No mic / no speech.

```bash
npm run test:ios:native
# equivalent:
swift test --package-path ios
# or
xcodebuild -scheme NitroSpeechLogic -destination 'platform=macOS' test
```

Covers AutoStopper/timers, repeating filter, transcriber param hash, permission mapping, engine candidate order, RMS/volume math, synthetic PCM AudioLevelTracker, and ErrorTrace joining.

## 4. Native unit Android (JUnit + Robolectric)

Standalone Gradle project at `tests/android` (does not boot SpeechRecognizer STT).

```bash
npm run test:android:native
# equivalent:
./apps/example/android/gradlew -p tests/android testDebugUnitTest
```

Requires Android SDK (`ANDROID_HOME` or `local.properties`). Covers AutoStopper, filters, volume/RMS, permission mapping, locale tags, on-device prepare decisions, result batch helpers, ErrorTrace joining, and the emulator silence → `RecognitionTaskFailed` mapping.

## Emulator speech contracts

- **iOS Simulator:** silence only. Lasting silence must not fail tests.
- **Android Emulator:** silence only; native speech-timeout after ~4–5s. Tests stop within **3s wall-clock of `startListening`**.
