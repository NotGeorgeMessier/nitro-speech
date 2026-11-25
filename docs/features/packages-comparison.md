# Speech recognition packages comparison

## Platforms and runtime

| Feature | react-native-nitro-speech | expo-speech-recognition | @dbkable/react-native-speech-to-text | react-native-speech-recognition-kit | @clarionhq/recognizer | expo-speech-transcriber | react-native-vosk | react-native-executorch |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| iOS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Android | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ (API 33+) | ✅ | ✅ |
| Web | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| New Architecture | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Nitro Module | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Expo config plugin | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Worklets support | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| iOS 26 SpeechAnalyzer | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ (file and SpeechTranscriber only) | ❌ | ❌ |

## Session

| Feature | react-native-nitro-speech | expo-speech-recognition | @dbkable/react-native-speech-to-text | react-native-speech-recognition-kit | @clarionhq/recognizer | expo-speech-transcriber | react-native-vosk | react-native-executorch |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Silence auto-finish | ✅ | ⚠️ (Android extras) | ❌ | ❌ | ❌ | ❌ | ⚠️ (fixed timeout) | ❌ |
| Auto-finish voice sensitivity | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Session prewarm | ✅ | ❌ | ❌ | ❌ | ⚠️ (session setup only) | ❌ | ❌ | ❌ |
| Live update session config | ✅ | ❌ | ❌ | ⚠️ (language only) | ❌ | ❌ | ❌ | ❌ |
| Session status | ⚠️ (active only) | ✅ | ❌ | ❌ | ✅ | ⚠️ (active only) | ❌ | ⚠️ (active only) |
| Background handling | ✅ | ⚠️ (iOS interrupt/route only) | ❓ | ❓ | ⚠️ (iOS interrupt/route only) | ❓ | ❓ | ❓ |

## Results

| Feature | react-native-nitro-speech | expo-speech-recognition | @dbkable/react-native-speech-to-text | react-native-speech-recognition-kit | @clarionhq/recognizer | expo-speech-transcriber | react-native-vosk | react-native-executorch |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Partial results | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Final results | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Confidence | ❌ | ✅ | ✅ | ⚠️ (docs only) | ✅ | ❌ | ❌ | ⚠️ (logprob only) |
| Word segments / timings | ❌ | ⚠️ (iOS; Android 14+ on-device) | ❌ | ❌ | ⚠️ (iOS only) | ❌ | ❌ | ✅ |
| Alternative transcripts | ❌ | ✅ | ❌ | ⚠️ (docs only) | ⚠️ (iOS segments) | ❌ | ❌ | ❌ |

## Language, offline, permissions

| Feature | react-native-nitro-speech | expo-speech-recognition | @dbkable/react-native-speech-to-text | react-native-speech-recognition-kit | @clarionhq/recognizer | expo-speech-transcriber | react-native-vosk | react-native-executorch |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Set locale | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ (via model) | ✅ |
| List supported locales | ✅ | ⚠️ (Android 13+) | ❌ | ✅ | ✅ | ❌ | ❌ | ⚠️ (typed codes only) |
| On-device / offline control | ✅ | ✅ | ❌ | ⚠️ (iOS, no toggle) | ✅ | ⚠️ (always on, no toggle) | ⚠️ (always offline) | ⚠️ (always on-device) |
| Model download | ✅ | ⚠️ (Android 13+) | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Permission helpers | ✅ | ✅ | ✅ | ❌ | ⚠️ (prompt on start) | ✅ | ⚠️ (Android only) | ❌ |
| Availability check | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ (iOS analyzer) | ❌ | ⚠️ (model ready) |
| Typed error codes | ✅ | ✅ | ✅ | ⚠️ (docs only) | ✅ | ⚠️ (string only) | ❌ | ✅ |

## Extra capabilities

| Feature | react-native-nitro-speech | expo-speech-recognition | @dbkable/react-native-speech-to-text | react-native-speech-recognition-kit | @clarionhq/recognizer | expo-speech-transcriber | react-native-vosk | react-native-executorch |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Volume metering | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Contextual strings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ (grammar list) | ❌ |
| Automatic punctuation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Offensive-word masking | ✅ | ⚠️ (Android 13+) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Haptic feedback | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| File transcription | ❌ | ✅ | ❌ | ❌ | ❌ | ⚠️ (iOS only) | ❌ | ❌ |
| Buffer transcription | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Persist recording | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Language detection | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ (Whisper multilingual) |
| Repeating word filter | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Language model selection (Android) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Batch handling (Android) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Formatting quality (Android) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Transcription preset (iOS) | ✅ | ⚠️ (task hint) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Atypical speech hint (iOS) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
