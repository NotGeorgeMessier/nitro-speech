# nitro-speech

[![npm version](https://img.shields.io/npm/v/@gmessier/nitro-speech.svg)](https://www.npmjs.com/package/@gmessier/nitro-speech)
[![license](https://img.shields.io/npm/l/@gmessier/nitro-speech.svg)](https://github.com/NotGeorgeMessier/nitro-speech/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@gmessier/nitro-speech.svg)](https://www.npmjs.com/package/@gmessier/nitro-speech)

 
> If you hit an issue, please open a GitHub issue or reach out to me on Discord / Twitter (X) — response is guaranteed.
>
> - GitHub Issues: [NotGeorgeMessier/nitro-speech/issues](https://github.com/NotGeorgeMessier/nitro-speech/issues)
> - Discord: `gmessier`
> - Twitter (X): `SufferingGeorge`

React Native Real-Time Speech Recognition Library, powered by [Nitro Modules](https://github.com/mrousavy/nitro).

#### Key Features:

- Built on Nitro Modules for low-overhead native bridging
- Configurable Timer for silence (default: 8 sec)
  - Callback `onAutoFinishProgress` for progress bars, etc...
  - Method `addAutoFinishTime` for single timer update
  - Method `updateAutoFinishTime` for constant timer update
- Optional Haptic Feedback on start and finish
- Speech-quality configurations:
  - Result is grouped by speech segments into Batches.
  - Param `disableRepeatingFilter` for consecutive duplicate-word filtering.
  - Param `androidDisableBatchHandling` for removing empty recognition result.
- Embedded Permission handling
  - Callback `onPermissionDenied` - if user denied the request
- Everything else that could be found in Expo or other libraries

## Table of Contents

- [Installation](#installation)
- [Permissions](#permissions)
- [Features](#features)
- [Usage](#usage)
  - [Recommended: useRecognizer Hook](#recommended-userecognizer-hook)
  - [With React Navigation (important)](#with-react-navigation-important)
  - [Cross-component control: RecognizerRef](#cross-component-control-recognizerref)
  - [Unsafe: RecognizerSession](#unsafe-recognizersession)
- [API Reference](#api-reference)
- [Requirements](#requirements)
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
| **Real-time transcription** | Get partial results as the user speaks, enabling live UI updates | ✅ | ✅ |
| **Auto-stop on silence** | Automatically stops recognition after configurable inactivity period (default: 8s) | ✅ | ✅ |
| **Auto-finish progress** | Progress callbacks showing countdown until auto-stop | ✅ | *(TODO)* |
| **Haptic feedback** | Optional haptics on recording start/stop | ✅ | ✅ |
| **Background handling** | Auto-stop when app loses focus/goes to background | ✅ | Not Safe *(TODO)* |
| **Permission handling** | Dedicated `onPermissionDenied` callback | ✅ | ✅ |
| **Repeating word filter** | Removes consecutive duplicate words from artifacts | ✅ | ✅ |
| **Locale support** | Configure speech recognizer for different languages | ✅ | ✅ |
| **Contextual strings** | Domain-specific vocabulary for improved accuracy | ✅ | ✅ |
| **Automatic punctuation** | Adds punctuation to transcription (iOS 16+) | ✅ | Auto |
| **Language model selection** | Choose between web search vs free-form models | Auto | ✅ |
| **Offensive word masking** | Control whether offensive words are masked | Auto | ✅ |
| **Formatting quality** | Prefer quality vs speed in formatting | Auto | ✅ |

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
    addAutoFinishTime, 
    updateAutoFinishTime 
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
        locale: 'en-US',
        disableRepeatingFilter: false,
        autoFinishRecognitionMs: 8000,
        
        contextualStrings: ['custom', 'words'],
        // Haptics (both platforms)
        startHapticFeedbackStyle: 'medium',
        stopHapticFeedbackStyle: 'light',
        // iOS specific
        iosAddPunctuation: true,
        // Android specific
        androidMaskOffensiveWords: false,
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
      <TouchableOpacity onPress={() => updateAutoFinishTime(10000)}>
        <Text>Update Timer to 10s</Text>
      </TouchableOpacity>
    </View>
  );
}
```

Use the handlers returned by this single hook instance inside that owner component.  
For other components, avoid creating another `useRecognizer` instance for the same session.

### With React Navigation (important)

React Navigation **doesn’t unmount screens** when you navigate — the screen can stay mounted in the background and come back without remounting. See: [Navigation lifecycle (React Navigation)](https://reactnavigation.org/docs/8.x/navigation-lifecycle/#summary).

Because of that, prefer tying recognition cleanup to **focus state**, not just component unmount. A simple approach is `useIsFocused()` and passing it into `useRecognizer`’s `destroyDeps` so recognition stops when the screen blurs. See: `[useIsFocused` (React Navigation)](https://reactnavigation.org/docs/8.x/use-is-focused).

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
RecognizerRef.updateAutoFinishTime(10000, true);
RecognizerRef.stopListening();
```

`RecognizerRef` exposes only method handlers and is safe for cross-component method access.

### Unsafe: RecognizerSession

`RecognizerSession` is the hybrid object. It gives direct access to callbacks and control methods, but it is unsafe to orchestrate the full session directly from it.

```typescript
import { RecognizerSession } from '@gmessier/nitro-speech';

// Set up callbacks
RecognizerSession.onReadyForSpeech = () => {
  console.log('Listening...');
};

RecognizerSession.onResult = (textBatches) => {
  console.log('Result:', textBatches.join('\n'));
};

RecognizerSession.onRecordingStopped = () => {
  console.log('Stopped');
};

RecognizerSession.onAutoFinishProgress = (timeLeftMs) => {
  console.log('Auto-stop in:', timeLeftMs, 'ms');
};

RecognizerSession.onError = (error) => {
  console.log('Error:', error);
};

RecognizerSession.onPermissionDenied = () => {
  console.log('Permission denied');
};

// Start listening
RecognizerSession.startListening({
  locale: 'en-US',
});

// Stop listening
RecognizerSession.stopListening();

// Manually add time to auto finish timer
RecognizerSession.addAutoFinishTime(5000); // Add 5 seconds
RecognizerSession.addAutoFinishTime(); // Reset to original time

// Update auto finish time
RecognizerSession.updateAutoFinishTime(10000); // Set to 10 seconds
RecognizerSession.updateAutoFinishTime(10000, true); // Set to 10 seconds and refresh progress
```

### ⚠️ About dispose()

The `RecognizerSession.dispose()` method is **NOT SAFE** and should rarely be used. Hybrid Objects in Nitro are typically managed by the JS garbage collector automatically. Only call `dispose()` in performance-critical scenarios where you need to eagerly destroy objects.

**See:** [Nitro dispose() documentation](https://nitro.margelo.com/docs/hybrid-objects#dispose)

## API Reference

### `useRecognizer(callbacks, destroyDeps?)`

#### Usage notes

- Use `useRecognizer` once per session/screen as the session setup owner.
- Cleanup stops recognition, so mounting multiple instances can unexpectedly end an active session.
- For method access in non-owner components, use `RecognizerRef`.

#### Parameters

- `callbacks` (object):
  - `onReadyForSpeech?: () => void` - Called when speech recognition starts
  - `onResult?: (textBatches: string[]) => void` - Called every time when partial result is ready (array of text batches)
  - `onRecordingStopped?: () => void` - Called when recording stops
  - `onAutoFinishProgress?: (timeLeftMs: number) => void` - Called each second during auto-finish countdown
  - `onError?: (message: string) => void` - Called when an error occurs
  - `onPermissionDenied?: () => void` - Called if microphone permission is denied
- `destroyDeps` (array, optional) - Additional dependencies for the cleanup effect. When any of these change (or the component unmounts), recognition is stopped.

#### Returns

- `startListening(params: SpeechToTextParams)` - Start speech recognition with the given parameters
- `stopListening()` - Stop speech recognition
- `addAutoFinishTime(additionalTimeMs?: number)` - Add time to the auto-finish timer (or reset to original if no parameter)
- `updateAutoFinishTime(newTimeMs: number, withRefresh?: boolean)` - Update the auto-finish timer

### `RecognizerRef`

- `startListening(params: SpeechToTextParams)`
- `stopListening()`
- `addAutoFinishTime(additionalTimeMs?: number)`
- `updateAutoFinishTime(newTimeMs: number, withRefresh?: boolean)`

### `RecognizerSession`

- Exposes callbacks (`onReadyForSpeech`, `onResult`, etc.) and control methods.
- Prefer `useRecognizer` (single owner) + `RecognizerRef` for app-level usage.

### `SpeechToTextParams`

Configuration object for speech recognition.

#### Common Parameters

- `locale?: string` - Language locale (default: `"en-US"`)
- `autoFinishRecognitionMs?: number` - Auto-stop timeout in milliseconds (default: `8000`)
- `contextualStrings?: string[]` - Array of domain-specific words for better recognition
- `disableRepeatingFilter?: boolean` - Disable filter that removes consecutive duplicate words (default: `false`)
- `startHapticFeedbackStyle?: 'light' | 'medium' | 'heavy'` - Haptic feedback style when microphone starts recording (default: `null` / disabled)
- `stopHapticFeedbackStyle?: 'light' | 'medium' | 'heavy'` - Haptic feedback style when microphone stops recording (default: `null` / disabled)

#### iOS-Specific Parameters

- `iosAddPunctuation?: boolean` - Add punctuation to results (iOS 16+, default: `true`)

#### Android-Specific Parameters

- `androidMaskOffensiveWords?: boolean` - Mask offensive words (Android 13+, default: `false`)
- `androidFormattingPreferQuality?: boolean` - Prefer quality over latency (Android 13+, default: `false`)
- `androidUseWebSearchModel?: boolean` - Use web search language model instead of free-form (default: `false`)
- `androidDisableBatchHandling?: boolean` - Disable default batch handling (may add many empty batches, default: `false`)

## Requirements

- React Native >= 0.76
- New Arch Only
- react-native-nitro-modules

## Troubleshooting

### Android Gradle sync issues

If you're having issues with Android Gradle sync, try running the prebuild for the core Nitro library:

```bash
cd android && ./gradlew :react-native-nitro-modules:preBuild
```

## License

MIT

## TODO

- [ ] (Android) Timer till the auto finish is called
- [ ] (Android) Cleanup when app loses the focus
