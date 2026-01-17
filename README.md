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

## Usage

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

## TODO

- [ ] (Android) Timer till the auto finish is called
- [ ] (Android) Cleanup when app loses the focus
