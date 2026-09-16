---
slug: /
sidebar_position: 1
---

# Getting Started

`react-native-nitro-speech` is a React Native real-time speech recognition library powered by Nitro Modules.

## Installation

```bash
npm install react-native-nitro-speech react-native-nitro-modules
# or
yarn add react-native-nitro-speech react-native-nitro-modules
# or
bun add react-native-nitro-speech react-native-nitro-modules
```

### Expo

This library works with Expo. Run prebuild to generate native code:

```bash
npx expo prebuild
```

Make sure New Architecture is enabled before running prebuild.

### iOS

```bash
cd ios && pod install
```

### Android

No additional setup required.

## Quickstart

After install (and iOS `Info.plist` keys — see [Permissions](./features/permissions.md)):

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

`useRecognizer` is the recommended session owner. Full example: [useRecognizer](./examples/use-recognizer.md). On-device: [On-device speech recognition](./features/on-device.md).

## Requirements

- React Native >= 0.76
- New Architecture only
- `react-native-nitro-modules` — the 4.9 line is developed against **0.36.x** (`0.36.4`)

## Next steps

- [Permissions](./features/permissions.md)
- [useRecognizer hook](./examples/use-recognizer.md)
- [Real-time transcription](./features/real-time-transcription.md)
- [On-device speech recognition](./features/on-device.md)
- [Supported locales](./features/supported-locales.md)
