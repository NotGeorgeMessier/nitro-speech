# NitroSpeech Harness Tests

This folder contains the on-device test suite for react-native-nitro-speech. Tests run on real devices or emulators/simulators through [react-native-harness](https://www.react-native-harness.dev), which embeds a Jest-compatible runner in the example app and talks to it over a Metro-driven bridge.

## Critical Emulator/Simulator Constraints

**These constraints are requirements from the library author (Andrei) and must be followed:**

### iOS Simulator

- **Behavior**: Speech stack only produces silence
- **Impact**: Lasting silence is OK; tests must **NOT fail** because of silence
- **What to test**: Permissions, lifecycle, error handling shapes, API contracts
- **What NOT to test**: Real transcription accuracy or content

### Android Emulator

- **Behavior**: Speech produces only silence
- **Impact**: After approximately **4–5 seconds** of silence, a specific silence-related error fires:
  - Native error: `SpeechRecognizer.ERROR_SPEECH_TIMEOUT` (code 6)
  - Native message: `"No speech input"`
  - Library mapping: `SpeechRecognitionError.RecognitionTaskFailed` (code 2)
  - ErrorDictionary message: `"Speech Recognition has started but failed"`

- **Required Pattern**: `startListening` → keep **≤3 seconds** → `stopListening`
- **This flow must**:
  - NOT hit the silence error
  - NOT crash
  - Complete cleanly

### Summary Table

| Platform | Silence Behavior | Safe Listening Duration | Error After Silence |
|----------|-----------------|------------------------|---------------------|
| iOS Simulator | Produces silence only | Extended periods OK | No error |
| Android Emulator | Produces silence only | **≤3 seconds** | ERROR_SPEECH_TIMEOUT after ~4-5s |
| Real Device | Normal speech input | N/A | N/A |

## Test Layout

Tests are split by domain:

| File | Covers |
|------|--------|
| [nitrospeech.permissions.harness.ts](nitrospeech.permissions.harness.ts) | `getPermissions()`, `PermissionStatus` enum, permission states |
| [nitrospeech.lifecycle.harness.ts](nitrospeech.lifecycle.harness.ts) | `startListening`, `stopListening`, `onReadyForSpeech`, `onRecordingStopped`, `getIsActive`, `getVoiceInputVolume`, `onAutoFinishProgress` |
| [nitrospeech.android-emulator.harness.ts](nitrospeech.android-emulator.harness.ts) | Android-specific: safe ≤3s start/stop cycles, verifies no silence error fires |
| [nitrospeech.ios-simulator.harness.ts](nitrospeech.ios-simulator.harness.ts) | iOS-specific: extended silence sessions, `getSupportedLocalesIOS`, `prewarm` |
| [nitrospeech.errors.harness.ts](nitrospeech.errors.harness.ts) | `ErrorDictionary`, `SpeechRecognitionError` enum, error callback shapes |

## Writing Tests

### 1. Use soft skips for platform-specific tests

```typescript
it('iOS-specific feature', async (context) => {
  if (Platform.OS !== 'ios') {
    return context.skip('iOS-specific test')
  }
  // ... test code
})
```

### 2. Use soft skips for missing features/locales

```typescript
it('tests iOS 26+ only API', async (context) => {
  if (Platform.OS !== 'ios' || parseInt(Platform.Version, 10) < 26) {
    return context.skip('requires iOS 26+')
  }
  // ... test code
})
```

### 3. Always clean up callbacks

```typescript
beforeEach(() => {
  SpeechRecognizer.onReadyForSpeech = undefined
  SpeechRecognizer.onRecordingStopped = undefined
  SpeechRecognizer.onResult = undefined
  SpeechRecognizer.onError = undefined
  // ... etc
})
```

### 4. Use deferred promises for callbacks

```typescript
import { deferred, withTimeout } from './test-utils'

const readyDeferred = deferred()
SpeechRecognizer.onReadyForSpeech = () => readyDeferred.resolve()

SpeechRecognizer.startListening({ locale: 'en-US' })
await withTimeout(readyDeferred.promise, 10_000, 'onReadyForSpeech')
```

### 5. Android tests: ALWAYS stop within 3 seconds

```typescript
// ✅ CORRECT for Android emulator
await sleep(2500) // ≤3 seconds
SpeechRecognizer.stopListening()

// ❌ WRONG - will hit ERROR_SPEECH_TIMEOUT
await sleep(5000) // >4 seconds
SpeechRecognizer.stopListening()
```

### 6. Don't test transcription accuracy on emulators

```typescript
// ❌ WRONG - will always fail on emulator
expect(results).toContain('hello world')

// ✅ CORRECT - test structure, not content
expect(Array.isArray(results)).toBe(true)
```

## Running Tests

### Prerequisites

1. Build the example app:

```bash
# Android
cd apps/example
bun install
bun run build:android

# iOS
cd apps/example
bun install
cd ios && pod install && cd ..
bun run build:ios
```

2. Grant permissions (Android):

```bash
BUNDLE_ID=com.nitrospeechexample
adb shell pm grant $BUNDLE_ID android.permission.RECORD_AUDIO
```

### Running Tests

```bash
# Android emulator
bun run test:harness:android

# iOS simulator
bun run test:harness:ios

# Run specific test file
bun run test:harness:android -- --testPathPatterns=permissions

# Watch mode
bun run test:harness:android -- --watch
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HARNESS_ANDROID_EMULATOR` | `Pixel_API_35` | Android emulator name |
| `HARNESS_ANDROID_API_LEVEL` | `35` | Android API level |
| `HARNESS_ANDROID_DEVICE_MODE` | `emulator` | `emulator` or `physical` |
| `HARNESS_IOS_SIMULATOR` | `iPhone 16 Pro` | iOS simulator name |
| `HARNESS_IOS_SIMULATOR_VERSION` | `18.0` | iOS simulator version |

## CI

Harness tests run on every push and PR that touches:
- `apps/example/__tests__/**`
- `apps/example/src/**`
- `src/**`
- `android/**`
- `ios/**`

See:
- `.github/workflows/harness-android.yml`
- `.github/workflows/harness-ios.yml`

## Known Limitations

1. **No speech transcription testing on emulators** - Silence is unavoidable
2. **Android ≤3s limit** - Tests must stop listening before silence timeout
3. **iOS locale availability** - Some locales may not be available on simulator
4. **Network-dependent features** - Some speech features require network connectivity
