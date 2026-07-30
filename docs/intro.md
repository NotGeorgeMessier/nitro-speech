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

## Requirements

- React Native >= 0.76
- New Architecture only
- `react-native-nitro-modules`

## Next steps

- [Permissions](./features/permissions.md)
- [useRecognizer hook](./examples/use-recognizer.md)
- [Real-time transcription](./features/real-time-transcription.md)
