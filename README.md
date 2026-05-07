# nitro-speech

[![npm version](https://img.shields.io/npm/v/@gmessier/nitro-speech.svg)](https://www.npmjs.com/package/@gmessier/nitro-speech)
[![license](https://img.shields.io/npm/l/@gmessier/nitro-speech.svg)](https://github.com/NotGeorgeMessier/nitro-speech/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@gmessier/nitro-speech.svg)](https://www.npmjs.com/package/@gmessier/nitro-speech)

 
> If you hit an issue or want to request a feature, please open a GitHub issue or reach out to me on Discord / Twitter (X) — response is guaranteed.
>
> - GitHub Issues: [NotGeorgeMessier/nitro-speech/issues](https://github.com/NotGeorgeMessier/nitro-speech/issues)
> - Discord: `gmessier`
> - Twitter (X): `SufferingGeorge`

#### Key Features:

- ⚡ Built with Nitro Modules for low-overhead native binding
- 🌎 Supports 60+ languages 
- 🍎 The only library that uses new `SpeechAnalyzer` with `SpeechTranscriber` or `DictationTranscriber` API for iOS 26+ (with fallback to legacy `SFSpeechRecognition` for older versions)
- ⏱️ Timer for silence
  - Configurable `autoFinishRecognitionMs` value (default: 8 sec)
  - Callback `onAutoFinishProgress` fires periodically with interval
  - Configurable interval `autoFinishProgressIntervalMs` value (default: 1 sec)
  - Method `updateConfig` with `autoFinishRecognitionMs` and `autoFinishProgressIntervalMs`
  allows changing the value on the fly
  - Method `resetAutoFinishTime` resets the Timer to the threshold
  - Method `addAutoFinishTime` adds ms once without changing threshold
  - Configurable volume-based sensitivity `resetAutoFinishVoiceSensitivity` for the timer from 0 to 1
- 🎤 Rich user voice input management 
  - Hook `useVoiceInputVolume()` for `raw` or `smoothed` normalized volume level from 0 to 1 -> easy to use for UI animations;
  And `db` as human-friendly value
  - Flexible callback `onVolumeChange` for custom behavior
  - Static method `getVoiceInputVolume()`
- 🧩 Lifecycle methods: `prewarm` | `updateConfig` | `getIsActive`
- 👆 Configurable Haptic Feedback on start and finish
- 🎚️ Speech-quality configurations:
  - Result is grouped by speech segments into Batches.
  - Param `iosPreset` - `shortForm` or `general` enables best transcriber for your situation
  - Param `disableRepeatingFilter` - filters out consecutive duplicate words.
  - Param `androidDisableBatchHandling` - disables empty partial results
  - Many more, see `SpeechRecognitionConfig`
- 🔓 Embedded Permission handling
  - Callback `onPermissionDenied` - if user denied the request
- 📦 Everything else that could be found in Expo or other libraries

## Table of Contents

- [Installation](#installation)
- [Permissions](#permissions)
- [Features](#features)
- [Usage](#usage)
  - [Recommended: useRecognizer Hook](#recommended-userecognizer-hook)
  - [With React Navigation (important)](#with-react-navigation-important)
  - [Cross-component control: RecognizerRef](#cross-component-control-recognizerref)
  - [Multithreading (react-native-worklets)](#multithreading-react-native-worklets)
  - [Voice input volume](#voice-input-volume)
  - [useRecognizerIsActive](#userecognizerisactive)
  - [Unsafe: SpeechRecognizer](#unsafe-speechrecognizer)
- [Requirements](#requirements)
- [Compatibility](#compatibility)
- [Troubleshooting](#troubleshooting)

## Installation

```bash
npm install @gmessier/nitro-speech react-native-nitro-modules
# or
yarn add @gmessier/nitro-speech react-native-nitro-modules
# or 
bun add @gmessier/nitro-speech react-native-nitro-modules
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

## Permissions

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

| Feature | Description | iOS | Android |
|---------|-------------|-----|---------|
| **Real-time transcription** | Gets partial results as the user speaks | ✅ | ✅ |
| **Locale support** | 60+ Supported locales | ✅ | ✅ |
| **Auto-finish on silence** | Automatically stops recognition after configurable inactivity period | ✅ | ✅ |
| **Auto-finish progress** | Callback `onAutoFinishProgress` with countdown until auto-stop | ✅ | ✅ |
| **Add Auto-finish Time** | Adds time to the auto finish timer once without changing the timer threshold | ✅ | ✅ |
| **Reset Auto-finish Time** | Resets the Timer to the threshold | ✅ | ✅ |
| **Voice input volume** | `useVoiceInputVolume`, `getVoiceInputVolume()`, `onVolumeChange` | ✅ | ✅ |
| **Reset Auto-finish Sensitivity** | The voice detector sensitivity to reset the Auto-finish time | ✅ | ✅ |
| **Prewarm** | Prepares resources, downloads assets, confirms locale availability | ✅ | ✅ |
| **Update config** | Static method `updateConfig` allows updating the config on the fly | ✅ | ✅ |
| **Is Active** | Static method `getIsActive()` | ✅ | ✅ |
| **Haptic feedback** | Haptic feedback on recording start/stop | ✅ | ✅ |
| **Permission handling** | Dedicated `onPermissionDenied` callback | ✅ | ✅ |
| **Background handling** | Stop when app loses focus/goes to background | ✅ | ✅ |
| **Repeating word filter** | Removes consecutive duplicate words from artifacts | ✅ | ✅ |
| **Offensive word masking** | Control whether offensive words are masked with * | iOS 26+ | ✅ |
| **Contextual strings** | Domain-specific vocabulary for improved accuracy | ✅ | ✅ |
| **Language model selection** | Choose between web search vs free-form models | Auto | ✅ |
| **Batch handling** | Filters out empty or repeated results | Auto | ✅ |
| **Formatting quality** | Prefer quality vs speed in formatting | Auto | ✅ |
| **Transcription preset** | `iosPreset` adapts for short phrases (`shortForm`) or `general` conversation | ✅ | Auto |
| **Automatic punctuation** | Adds punctuation to transcription (iOS 16+) | ✅ | Auto |
| **Atypical speech hint** | Hint iOS that speech may include accent, lisp, or other confounding traits | ✅ | Auto |
| **getSupportedLocalesIOS** | Supported locales for iOS (No available API for Android) | ✅ | X |


## Usage

### Recommended: useRecognizer Hook

`useRecognizer` is lifecycle-aware. It calls `stopListening()` during cleanup (unmount or `destroyDeps` change).  
Because of that, treat it as a **single session owner** setup hook: use it once per recognition session/screen, where you define callbacks.

```typescript
import { useRecognizer } from '@gmessier/nitro-speech';

function MyComponent() {
  const { 
    startListening, 
    stopListening, 
    resetAutoFinishTime, 
    addAutoFinishTime, 
    updateConfig,
    getSupportedLocalesIOS,
    getIsActive,
    getVoiceInputVolume,
  } = useRecognizer({
    onReadyForSpeech: () => {
      console.log('Listening...');
    },
    onResult: (textBatches) => {
      console.log('Result:', textBatches.join('\n'));
    },
    onRecordingStopped: () => {
      console.log('Stopped');
    },
    onAutoFinishProgress: (timeLeftMs) => {
      console.log('Auto-stop in:', timeLeftMs, 'ms');
    },
    onError: (error) => {
      console.log('Error:', error);
    },
    onPermissionDenied: () => {
      console.log('Permission denied');
    },
  });

  return (
    <View>
      <TouchableOpacity onPress={() => startListening({ 
        // Universal
        locale: "en-US",
        contextualStrings: ['custom', 'words'],
        maskOffensiveWords: false,
        // Mutable properties
        autoFinishRecognitionMs: 12000,
        autoFinishProgressIntervalMs: 1000,
        resetAutoFinishVoiceSensitivity: 0.4,
        disableRepeatingFilter: false,
        startHapticFeedbackStyle: 'medium',
        stopHapticFeedbackStyle: 'light',
        // iOS specific, non-mutable
        iosAddPunctuation: true,
        iosPreset: 'general',
        iosAtypicalSpeech: false,
        // Android specific, non-mutable
        androidFormattingPreferQuality: false,
        androidUseWebSearchModel: false,
        androidDisableBatchHandling: false,
      })}>
        <Text>Start Listening</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={stopListening}>
        <Text>Stop Listening</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => addAutoFinishTime(5000)}>
        <Text>Add 5s to Timer</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => resetAutoFinishTime()}>
        <Text>Reset Timer</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => updateConfig(
            {
              autoFinishRecognitionMs: 12000,
              autoFinishProgressIntervalMs: 500,
              resetAutoFinishVoiceSensitivity: 0.65,
            },
            true
          )>
        <Text>Update Timer to 12s, 500ms interval, 0.65 sensitivity, with reset</Text>
      </TouchableOpacity>
    </View>
  );
}
```

On iOS 26+, the recognizer prefers the newer `SpeechTranscriber` path for general cases. Setting `iosPreset: 'shortForm'`, `iosAddPunctuation: false`, or `iosAtypicalSpeech: true` switches priority to `DictationTranscriber` that is better suited for short utterances or non-standard speech patterns.

### With React Navigation (important)

React Navigation **doesn’t unmount screens** when you navigate — the screen can stay mounted in the background and come back without remounting. See: [Navigation lifecycle (React Navigation)](https://reactnavigation.org/docs/8.x/navigation-lifecycle/#summary).

Because of that, prefer tying recognition cleanup to **focus state**, not just component unmount. A simple approach is `useIsFocused()` and passing it into `useRecognizer`’s `destroyDeps` so recognition stops when the screen blurs. See: [`useIsFocused` (React Navigation)](https://reactnavigation.org/docs/8.x/use-is-focused).

```typescript
const isFocused = useIsFocused();
const { 
  // ...
} = useRecognizer(
  {
    // ...
  },
  [isFocused]
);
```

### Cross-component control: RecognizerRef

If you need to call recognizer methods from other components without prop drilling, use `RecognizerRef`.

```typescript
import { RecognizerRef } from '@gmessier/nitro-speech';

RecognizerRef.startListening({ locale: 'en-US' });
RecognizerRef.addAutoFinishTime(5000);
RecognizerRef.resetAutoFinishTime();
RecognizerRef.updateConfig(
  {
    autoFinishRecognitionMs: 12000,
    autoFinishProgressIntervalMs: 500,
    resetAutoFinishVoiceSensitivity: 0.65,
  },
  true
);
RecognizerRef.getIsActive();
RecognizerRef.getVoiceInputVolume();
RecognizerRef.stopListening();
// iOS only
RecognizerRef.getSupportedLocalesIOS();
```

`RecognizerRef` exposes only method handlers and is safe for cross-component method access.

### Multithreading (react-native-worklets)
All methods are thread-safe and can be called from UI thread or custom worklets 
```typescript
import { createWorkletRuntime, scheduleOnRuntime } from 'react-native-worklets';
const workletRuntime = createWorkletRuntime({ name: 'background' });

onPress={() => {
  scheduleOnRuntime(workletRuntime, () => {
    // or SpeechRecognizer
    // or just updateConfig from useRecognizer
    RecognizerRef.updateConfig({
      autoFinishRecognitionMs: 10000,
      autoFinishProgressIntervalMs: 200,
      resetAutoFinishVoiceSensitivity: 0.10,
    });
  });
}}
```

### Voice input volume

#### useVoiceInputVolume

⚠️ **Technical limitation**: this hook re-renders component a lot.

```typescript
import { useVoiceInputVolume } from '@gmessier/nitro-speech';

function VoiceMeter() {
  const volumeEvent = useVoiceInputVolume();
  return <>
    <Text>{volumeEvent.smoothedVolume.toFixed(2)}</Text>
    <Text>{volumeEvent.rawVolume.toFixed(2)}</Text>
    <Text>{volumeEvent.db}</Text>
  </>;
}
```

#### Reanimated: useSharedValue, worklets, UI thread

As a better alternative you can control volume via SharedValue and apply it only on UI thread with Reanimated.
This way you will avoid re-renders since the volume will be stored on UI thread

```typescript
function VoiceMeter() {
  const sharedVolume = useSharedValue(0)
  const {
    // ...
  } = useRecognizer(
    {
      // ...
      onVolumeChange: (volumeEvent) => {
        "worklet";
        sharedVolume.value = volumeEvent.smoothedVolume
      },
      // ...
    }
  );
}
```

### useRecognizerIsActive

```typescript
import { useRecognizerIsActive } from '@gmessier/nitro-speech';

function MyComponent() {
  const isActive = useRecognizerIsActive();
  return <Text>{isActive ? 'Listening...' : 'Not listening'}</Text>;
}
```

### Unsafe: SpeechRecognizer

`SpeechRecognizer` is the hybrid object. It gives direct access to callbacks and control methods, but it is unsafe to orchestrate the full session directly from it.

```typescript
import { SpeechRecognizer, speechRecognizerVolumeChangeHandler } from '@gmessier/nitro-speech';

// Set up callbacks
SpeechRecognizer.onReadyForSpeech = () => {
  console.log('Listening...');
};

SpeechRecognizer.onResult = (textBatches) => {
  console.log('Result:', textBatches.join('\n'));
};

SpeechRecognizer.onRecordingStopped = () => {
  console.log('Stopped');
};

SpeechRecognizer.onAutoFinishProgress = (timeLeftMs) => {
  console.log('Auto-stop in:', timeLeftMs, 'ms');
};

SpeechRecognizer.onError = (error) => {
  console.log('Error:', error);
};

SpeechRecognizer.onPermissionDenied = () => {
  console.log('Permission denied');
};

SpeechRecognizer.onVolumeChange = (volume) => {
  console.log('new volume: ', volume);
};
// OR use speechRecognizerVolumeChangeHandler to enable useVoiceInputVolume hook manually
SpeechRecognizer.onVolumeChange = speechRecognizerVolumeChangeHandler


// Start listening
SpeechRecognizer.startListening({
  locale: 'en-US',
});

// Stop listening
SpeechRecognizer.stopListening();

// Manually add time to auto finish timer
SpeechRecognizer.addAutoFinishTime(5000); // Add 5 seconds
SpeechRecognizer.addAutoFinishTime(); // Reset to original time

// Update config
SpeechRecognizer.updateConfig({
  autoFinishRecognitionMs: 10000,
  autoFinishProgressIntervalMs: 200,
  resetAutoFinishVoiceSensitivity: 0.10,
}, true); // Set to 10 seconds, 200ms interval, 0.10 sensitivity, with reset
```

### ⚠️ About dispose()

The `SpeechRecognizer.dispose()` method is **NOT SAFE** and should rarely be used. Hybrid Objects in Nitro are typically managed by the JS garbage collector automatically. Only call `dispose()` in performance-critical scenarios where you need to eagerly destroy objects.

**See:** [Nitro dispose() documentation](https://nitro.margelo.com/docs/hybrid-objects#dispose)

## Requirements

- React Native >= 0.76
- New Arch Only
- react-native-nitro-modules

## Compatibility

Latest versions of `@gmessier/nitro-speech` require [react-native-nitro-modules 0.35.0 or higher](https://github.com/mrousavy/nitro/releases/tag/v0.35.0).


| Compatibility                          | Supported versions                |
| -------------------------------------- | --------------------------------- |
| `react-native-nitro-modules <= 0.34.*` | `@gmessier/nitro-speech <= 0.2.*` |
| `react-native-nitro-modules >= 0.35.*` | `@gmessier/nitro-speech >= 0.3.*` |

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
