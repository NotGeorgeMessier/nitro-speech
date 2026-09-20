# Testing NitroSpeech

Four layers. Andrei can run each independently. Native suites do not use a real microphone or STT accuracy goldens.

| Layer | Ready? | How to run | What it covers |
|-------|--------|------------|----------------|
| **1. JS unit (Jest)** | Ready | `npm test` | ErrorDictionary vs 4.10 codes, optional `onError` trace, PermissionStatus, volume/active helpers, RecognizerRef |
| **2. JS on-device (Harness)** | Ready | `npm run test:harness:android` / `test:harness:ios` | permissions, lifecycle start/stop, Android ≤3s, iOS silence, errors, on-device prefer |
| **3. Native unit iOS (XCTest)** | Ready | `npm run test:ios:native` | AutoStopper, repeating filter, volume/RMS, permission mapping, engine selection, ErrorTrace |
| **4. Native unit Android (JUnit + Robolectric)** | Ready | `npm run test:android:native` | AutoStopper, filters, volume/RMS, permission mapping, session helpers, on-device decisions, ErrorTrace |

Full command list and remaining gaps: see below.

## 1. JS unit

```bash
npm test
# from apps/example:
npm test
npm run test:unit
```

No device. Uses Jest + a Nitro hybrid mock (`apps/example/jest.setup.js`).

## 2. Harness

Debug app must already be installed on the emulator/simulator.

```bash
npm run test:harness:android
npm run test:harness:ios
```

Override AVD with `HARNESS_ANDROID_EMULATOR`. iOS is simulator-only (`HARNESS_IOS_SIMULATOR`, `HARNESS_IOS_SIMULATOR_VERSION`).

Contracts:

- iOS Simulator: silence only. Lasting silence must not fail tests.
- Android Emulator: silence only; native `ERROR_SPEECH_TIMEOUT` after ~4–5s. Stop within **3s wall-clock of `startListening`**.

## 3. Native iOS (XCTest)

Swift package: `ios/Package.swift`, tests in `ios/Tests`. Production logic under `ios/Logic` is also compiled into the CocoaPods module.

```bash
npm run test:ios:native
# or
swift test --package-path ios
# or
cd ios && xcodebuild -scheme NitroSpeechLogic -destination 'platform=macOS' test
```

Needs Xcode / Swift. Destination `macOS` is enough (no simulator, no mic).

## 4. Native Android (JUnit + Robolectric)

Standalone module `tests/android` compiles only Nitro-free Kotlin (`recognizer/logic/*`, `AutoStopper`, `Logger`, `ErrorTrace`) plus `android/src/test`.

```bash
npm run test:android:native
# or
./apps/example/android/gradlew -p tests/android testDebugUnitTest
```

Needs Android SDK. Create `tests/android/local.properties` with `sdk.dir=...` or export `ANDROID_HOME`.

The same tests also live on the library source set (`android/src/test`) so `./gradlew :react-native-nitro-speech:testDebugUnitTest` from the example app works after a normal RN Android configure.

## Remaining gaps

- HybridRecognizer / engine start paths that need a live `SpeechRecognizer` or `SFSpeechRecognizer` session
- Real STT accuracy / golden audio (intentionally out of scope)
- HapticImpact (needs vibrator / UIKit feedback generator)
- LocaleManager AssetInventory / on-device model download UI
- `useRecognizer` React hook lifecycle beyond the example render smoke test
