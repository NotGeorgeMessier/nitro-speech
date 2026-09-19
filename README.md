# react-native-nitro-speech

[![npm version](https://img.shields.io/npm/v/react-native-nitro-speech.svg)](https://www.npmjs.com/package/react-native-nitro-speech)
[![license](https://img.shields.io/npm/l/react-native-nitro-speech.svg)](https://github.com/NotGeorgeMessier/nitro-speech/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/react-native-nitro-speech.svg)](https://www.npmjs.com/package/react-native-nitro-speech)

### React Native real-time Speech Recognition Library powered by Nitro Modules

This is `react-native-nitro-speech` package ([npm](https://www.npmjs.com/package/react-native-nitro-speech)). The old name `@gmessier/nitro-speech` was deprecated @0.4.8 ([npm](https://www.npmjs.com/package/@gmessier/nitro-speech)).

To compare all React Native speech recognition packages [check this table](./docs/features/packages-comparison.md)

#### Key Features:

- ⚡ Built with Nitro Modules for low-overhead native binding
- 🌎 Supports 60+ languages 
- 🍎 The only library implementing new `SpeechAnalyzer` with `SpeechTranscriber` or `DictationTranscriber` API for iOS 26+ (with fallback to legacy `SFSpeechRecognizer` for older versions)
- 🧵 Full support of `react-native-worklets` - each method is accessible from any runtime
- ⏱️ Timer for silence
  - Configurable and mutable `autoFinishRecognitionMs` value (default: 8 sec)
  - Callback `onAutoFinishProgress` fires periodically with an interval
  - Configurable and mutable interval `autoFinishProgressIntervalMs` value (default: 1 sec)
  - Method `resetAutoFinishTime` resets the timer to the threshold
  - Method `addAutoFinishTime` adds time once without changing threshold
  - Configurable volume-based sensitivity `resetAutoFinishVoiceSensitivity`
- 🎤 Rich user voice input management 
  - Hook `useVoiceInputVolume` and method `getVoiceInputVolume` for displaying volume in dB or making UI animations with smoothedVolume
  - Callback `onVolumeChange` for advanced use cases
- 🧩 Session Lifecycle methods: `prewarm` and `updateConfig`
- 👆 Configurable Haptic Feedback on start and finish
- 🎚️ Speech-quality features: see full list [here](./docs/features/real-time-transcription.md#real-time-transcription)
- 📴 On-device recognition via `onDevice: 'prefer' | 'require'`
  - Preload model during `prewarm` with `loadOnDeviceModel`
- 🔓 Embedded Permission handling
  - Callback `onPermissionDenied` and method `getPermissions`
  - Option `requestPermission` for `prewarm` method
- 📦 Everything else that could be found in Expo or other libraries

## Table of Contents

- [Installation](#installation)
- [Quickstart](#quickstart)
- [Permissions](#permissions)
- [Features](#features)
- [Requirements](#requirements)
- [Compatibility](#compatibility)
- [Contributions and feedback](#contributions-and-feedback)
- [Troubleshooting](#troubleshooting)
- Usage:
  - [Recommended: useRecognizer Hook](./docs/examples/use-recognizer.md#hook-userecognizer)
  - [With React Navigation (important)](./docs/examples/use-recognizer.md#with-react-navigation)
  - [Cross-component control: RecognizerRef](./docs/examples/use-recognizer.md#recognizerref)
  - [Multithreading (react-native-worklets)](./docs/features/worklets.md#worklets)
  - [Voice input volume](./docs/features/voice-input-volume.md#voice-input-volume)
  - [Is active](./docs/features/is-recognizer-active.md#is-recognizer-active)
  - [On-device recognition](./docs/features/on-device.md)
  - [Supported locales](./docs/features/supported-locales.md#supported-locales)
  - [Direct access to SpeechRecognizer](./docs/examples/speech-recognizer.md#speechrecognizer)

## Installation

```bash
npm install react-native-nitro-speech react-native-nitro-modules
# or
yarn add react-native-nitro-speech react-native-nitro-modules
# or
bun add react-native-nitro-speech react-native-nitro-modules
```

### Expo

This library works with Expo. You need to run prebuild to generate native code:

```bash
npx expo prebuild
```

**Note**: Make sure New Arch is enabled in your Expo configuration before running prebuild.

### iOS

```bash
cd ios && pod install
```

### Android

No additional setup required.

## Quickstart

```typescript
import { useRecognizer } from 'react-native-nitro-speech'

const { startListening, stopListening } = useRecognizer({
  onReadyForSpeech: () => console.log('Listening...'),
  onRecordingStopped: () => console.log('Stopped'),
  onResult: (textBatches) => console.log('Result:', textBatches.join('\n')),
  onAutoFinishProgress: (timeLeftMs) =>
    console.log('Auto-finish in:', timeLeftMs, 'ms'),
  onError: (code) => console.log('Error:', code),
  onPermissionDenied: () => console.log('Permission denied'),
})

startListening({
  locale: 'en-US',
})
```

## Permissions

More about permissions [here](./docs/features/permissions.md#permissions)

### Android

No actions required.
The library declares the required permission in its `AndroidManifest.xml` (merged automatically):

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### iOS

Add the following keys to your app's `Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access for speech recognition</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>This app needs speech recognition to convert speech to text</string>
```

Both permissions are required for speech recognition to work on iOS.

## Features

| Feature                           | Documentation page                                                              | iOS     | Android  |
| --------------------------------- | ------------------------------------------------------------------------------- | ------- | -------- |
| **Real-time transcription**       | [Link 🔗](./docs/features/real-time-transcription.md#real-time-transcription)        | ✅       | ✅       |
| **Full worklets support**         | [Link 🔗](./docs/features/worklets.md#worklets)                                      | ✅       | ✅       |
| **New advanced iOS models**       | [Link 🔗](./docs/features/supported-locales.md#ios)                                  | ✅       | ✅       |
| **Locale support**                | [Link 🔗](./docs/features/supported-locales.md#supported-locales)                    | ✅       | ✅       |
| **On-device recognition**         | [Link 🔗](./docs/features/on-device.md)                                              | ✅       | ✅       |
| **Auto-finish on silence**        | [Link 🔗](./docs/features/silence-timer.md#auto-finish-on-silence)                   | ✅       | ✅       |
| **Auto-finish progress**          | [Link 🔗](./docs/features/silence-timer.md#auto-finish-progress)                     | ✅       | ✅       |
| **Auto-finish progress interval** | [Link 🔗](./docs/features/silence-timer.md#auto-finish-progress-interval)            | ✅       | ✅       |
| **Add Auto-finish Time**          | [Link 🔗](./docs/features/silence-timer.md#add-auto-finish-time)                     | ✅       | ✅       |
| **Reset Auto-finish Time**        | [Link 🔗](./docs/features/silence-timer.md#reset-auto-finish-time)                   | ✅       | ✅       |
| **Reset Auto-finish Sensitivity** | [Link 🔗](./docs/features/silence-timer.md#reset-auto-finish-time-voice-sensitivity) | ✅       | ✅       |
| **Voice input volume**            | [Link 🔗](./docs/features/voice-input-volume.md#voice-input-volume)                  | ✅       | ✅       |
| **Prewarm**                       | [Link 🔗](./docs/features/prewarm.md#prewarm)                                        | ✅       | ✅       |
| **Update config**                 | [Link 🔗](./docs/features/update-config.md#update-config)                            | ✅       | ✅       |
| **Active state**                  | [Link 🔗](./docs/features/is-recognizer-active.md#is-recognizer-active)              | ✅       | ✅       |
| **Haptic feedback**               | [Link 🔗](./docs/features/real-time-transcription.md#haptic-feedback)                | ✅       | ✅       |
| **Permission handling**           | [Link 🔗](./docs/features/permissions.md#lifecycle)                                  | ✅       | ✅       |
| **Background handling**           | [Link 🔗](./docs/features/edge-cases.md#background-handling)                         | ✅       | ✅       |
| **Repeating word filter**         | [Link 🔗](./docs/features/real-time-transcription.md#repeating-word-filter)          | ✅       | ✅       |
| **Offensive word masking**        | [Link 🔗](./docs/features/real-time-transcription.md#offensive-word-masking)         | iOS 26+  | ✅       |
| **Contextual strings**            | [Link 🔗](./docs/features/real-time-transcription.md#contextual-strings)             | ✅       | ✅       |
| **Language model selection**      | [Link 🔗](./docs/features/real-time-transcription.md#language-model-selection)       | Auto     | ✅       |
| **Batch handling**                | [Link 🔗](./docs/features/real-time-transcription.md#batch-handling)                 | Auto     | ✅       |
| **Formatting quality**            | [Link 🔗](./docs/features/real-time-transcription.md#formatting-quality)             | Auto     | ✅       |
| **Transcription preset**          | [Link 🔗](./docs/features/real-time-transcription.md#transcription-preset)           | ✅       | Auto     |
| **Automatic punctuation**         | [Link 🔗](./docs/features/real-time-transcription.md#automatic-punctuation)          | ✅       | Auto     |
| **Atypical speech hint**          | [Link 🔗](./docs/features/real-time-transcription.md#atypical-speech-hint)           | ✅       | Auto     |

## Requirements

- React Native >= 0.76
- New Arch Only
- react-native-nitro-modules

## Compatibility

`react-native-nitro-modules` [published a version 0.35.0](https://github.com/mrousavy/nitro/releases/tag/v0.35.0) that is incompatible with older versions.

If your project can't migrate to the latest version of `react-native-nitro-modules`, you can use the older versions of `@gmessier/nitro-speech`

| nitro-speech                      | react-native-nitro-modules             |
| ----------------------------------| -------------------------------------- |
| `@gmessier/nitro-speech < 0.3.*`  | `react-native-nitro-modules < 0.35.0`  |
| `@gmessier/nitro-speech >= 0.3.*` | `react-native-nitro-modules >= 0.35.0` |
| `react-native-nitro-speech *`     | `react-native-nitro-modules >= 0.35.0` |


## Contributions and feedback

> If you hit an issue or want to request a feature, please open a GitHub issue or reach out to me on Discord / Twitter (X) — response is guaranteed.
>
> - [GitHub Issues](https://github.com/NotGeorgeMessier/nitro-speech/issues)
> - [Twitter (X)](https://x.com/sufferinggeorge)
> - Discord: `@gmessier`

## Troubleshooting

### Android Gradle sync issues

If you're having issues with Android Gradle sync, try running the prebuild for the library that causes the issue:

e.g. failed in `react-native-nitro-modules`:

```bash
cd android && ./gradlew :react-native-nitro-modules:preBuild
```

e.g. failed in `react-native-worklets`:

```bash
cd android && ./gradlew :react-native-worklets:preBuild
```

## License

MIT
