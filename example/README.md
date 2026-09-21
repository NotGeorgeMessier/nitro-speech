# NitroSpeech example

Minimal React Native CLI app for `react-native-nitro-speech`.

- React Native **0.87.1** (latest stable at branch time)
- `react-native-nitro-modules` **0.37.1**
- New Architecture on
- Local library via `file:..`

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

iOS 27 / Xcode 27 SDK requires a scene-based lifecycle. This example uses Kirill Zyushko's pattern: `SceneDelegate` creates `UIWindow(windowScene:)` and `AppDelegate.startReactNative(in:)` starts RN. `Info.plist` includes `UIApplicationSceneManifest`.

From this directory, install JS deps and CocoaPods, then run:

```bash
npm install
cd ios && pod install && cd ..
npm run ios
```

From the repo root: `npm run example:ios` (after `npm install` and `pod install` in `example/`).

`Info.plist` already includes `NSMicrophoneUsageDescription`, `NSSpeechRecognitionUsageDescription`, and `RCTNewArchEnabled`.

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

Native unit tests (no mic / no STT goldens):

```bash
# from repo root
npm run test:ios:native
npm run test:android:native
```

agent-device (Layer 5, installed-app Listen UI smoke — not a Jest/CI gate):

```bash
# from repo root, after bun install / npm install
npm run test:agent-device:doctor
npm run test:agent-device:smoke:ios      # prints commands; needs a booted sim to actually drive
npm run test:agent-device:smoke:android
```

Enable Cursor MCP from `.cursor/mcp.json` and ask the agent to drive the Listen flow. Details: [`docs/testing.md`](../docs/testing.md) and [`tests/agent-device/README.md`](../tests/agent-device/README.md).

Override the Android AVD with `HARNESS_ANDROID_EMULATOR`. iOS is simulator-only.

### Emulator speech contracts

- **iOS Simulator:** silence only. Lasting silence must not fail tests.
- **Android Emulator:** silence only; native speech-timeout after ~4–5s. Tests stop within **3s wall-clock of `startListening`**.

Tests cover permissions, start/stop, errors, and the on-device service/prefer path. They are not STT accuracy tests.
