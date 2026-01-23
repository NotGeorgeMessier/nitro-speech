# nitro-speech

> **⚠️ Work in Progress**
> 
> This library is under active development.

Speech recognition for React Native, powered by [Nitro Modules](https://github.com/mrousavy/nitro).

## Installation

```bash
npm install @gmessier/nitro-speech react-native-nitro-modules
# or
yarn add @gmessier/nitro-speech react-native-nitro-modules
# or 
bun add @gmessier/nitro-speech react-native-nitro-modules
```

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
| **Auto-stop on silence** | Automatically stops recognition after configurable inactivity period (default: 8s) | ✅ (flag) | ✅ (flag) |
| **Auto-finish progress** | Progress callbacks showing countdown until auto-stop | ✅ | ❌ *(TODO)* |
| **Locale support** | Configure speech recognizer for different languages | ✅ (flag) | ✅ (flag) |
| **Background handling** | Auto-stop when app loses focus/goes to background | ✅ | Not Safe *(TODO)* |
| **Contextual strings** | Domain-specific vocabulary for improved accuracy | ✅ (flag) | ✅ (flag) |
| **Repeating word filter** | Removes consecutive duplicate words from artifacts | ✅ (flag) | ✅ (flag) |
| **Permission handling** | Dedicated `onPermissionDenied` callback | ✅ | ✅ |
| **Automatic punctuation** | Adds punctuation to transcription (iOS 16+) | ✅ (flag) | Auto |
| **Language model selection** | Choose between web search vs free-form models | ❌ | ✅ (flag) |
| **Offensive word masking** | Control whether offensive words are masked | Auto | ✅ (flag) |
| **Formatting quality** | Prefer quality vs speed in formatting | ❌ | ✅ (flag) |

## Usage

### Recommended: useRecognizer Hook

```typescript
import { useRecognizer } from '@gmessier/nitro-speech';

function MyComponent() {
  const { startListening, stopListening } = useRecognizer({
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
    <div>
      <button onClick={() => startListening({ locale: 'en-US' })}>
        Start Listening
      </button>
      <button onClick={stopListening}>
        Stop Listening
      </button>
    </div>
  );
}
```

### Alternative: Static Recognizer (Not Safe)

```typescript
import { Recognizer } from '@gmessier/nitro-speech';

// Set up callbacks
Recognizer.onReadyForSpeech = () => {
  console.log('Listening...');
};

Recognizer.onResult = (textBatches) => {
  console.log('Result:', textBatches.join('\n'));
};

Recognizer.onRecordingStopped = () => {
  console.log('Stopped');
};

Recognizer.onAutoFinishProgress = (timeLeftMs) => {
  console.log('Auto-stop in:', timeLeftMs, 'ms');
};

Recognizer.onError = (error) => {
  console.log('Error:', error);
};

// Start listening
Recognizer.startListening({
  locale: 'en-US',
});

// Stop listening
Recognizer.stopListening();
```

### ⚠️ About dispose()

The `Recognizer.dispose()` method is **NOT SAFE** and should rarely be used. Hybrid Objects in Nitro are typically managed by the JS garbage collector automatically. Only call `dispose()` in performance-critical scenarios where you need to eagerly destroy objects.

**See:** [Nitro dispose() documentation](https://nitro.margelo.com/docs/hybrid-objects#dispose)

## Troubleshooting

### Android Gradle sync issues

If you're having issues with Android Gradle sync, try running the prebuild for the core Nitro library:

```bash
cd android && ./gradlew :react-native-nitro-modules:preBuild
```

## TODO

- [ ] (Android) Timer till the auto finish is called
- [ ] (Android) Cleanup when app loses the focus
