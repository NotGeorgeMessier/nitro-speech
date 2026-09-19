# NitroSpeech example

Minimal React Native CLI app for `react-native-nitro-speech`.

- React Native **0.87.1** (latest stable at branch time)
- `react-native-nitro-modules` **0.37.1**
- New Architecture on
- Local library via `file:../..`

## Run

From this directory:

```bash
npm install
```

### Android

```bash
npm run android
```

### iOS

Add CocoaPods once, then run:

```bash
cd ios && pod install && cd ..
npm run ios
```

`Info.plist` already includes `NSMicrophoneUsageDescription` and `NSSpeechRecognitionUsageDescription`.

Tap **Start listening**. The screen shows permission status, listening state, volume, optional on-device prefer, and any result/error.

## Tests

Jest (pure JS, no device):

```bash
npm test
```

Harness (on-device lifecycle; debug app must already be installed on the emulator/simulator):

```bash
npm run test:harness:android
npm run test:harness:ios
```

Override the Android AVD with `HARNESS_ANDROID_EMULATOR`. iOS is simulator-only.

### Emulator speech contracts

- **iOS Simulator:** silence only. Lasting silence must not fail tests.
- **Android Emulator:** silence only; native speech-timeout after ~4–5s. Tests stop within **3s wall-clock of `startListening`**.

Tests cover permissions, start/stop, errors, and the on-device service/prefer path. They are not STT accuracy tests.
