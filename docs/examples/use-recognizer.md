# Speech Recognizer Session

There are 2 ways to orchestrate the speech recognizer session:

1. Hook `useRecognizer` as initializer and `RecognizerRef` for safe cross-component access
2. Manually wire up everything using the `SpeechRecognizer` hybrid object

This is an example of how to initialize the session with `useRecognizer` hook (recommended approach).

## Hook useRecognizer

`useRecognizer` is lifecycle-aware. It calls `stopListening()` during cleanup (unmount or `destroyDeps` change).  
Because of that, treat it as a **single session owner** setup hook: use it once per recognition session/screen, where you define callbacks.

On iOS 26+, the recognizer prefers the most advanced `SpeechTranscriber` path for general cases. Setting `iosPreset: 'shortForm' OR 'speed'`, `iosAddPunctuation: false`, or `iosAtypicalSpeech: true` switches priority to `DictationTranscriber` that is better suited for short utterances or non-standard speech patterns.

### Setup

- Set up the callbacks
- Make sure destroy dependencies are correct
- Receive the methods to control the session

### Session configuration

- Common features [here](../features/real-time-transcription.md#real-time-transcription)
- Mutable properties [here](../features/update-config.md#update-config)
- Silence timer [here](../features/silence-timer.md#silence-timer)  

### Methods

The session lifecycle:

- `startListening` - Start the session with the given configuration, sync, track status with `onReadyForSpeech`, `onError` or `useRecognizerIsActive`
- `stopListening` - Stop the session, sync, track status with `onRecordingStopped` or `useRecognizerIsActive`
- `prewarm` - [Link 🔗](../features/prewarm.md#prewarm)
- `updateConfig` - [Link 🔗](../features/update-config.md#update-config)
- `addAutoFinishTime` - [Link 🔗](../features/silence-timer.md#add-auto-finish-time)
- `resetAutoFinishTime` - [Link 🔗](../features/silence-timer.md#reset-auto-finish-time)
- `getIsActive` - [Link 🔗](../features/is-recognizer-active.md#is-recognizer-active)
- `getVoiceInputVolume` - [Link 🔗](../features/voice-input-volume.md#voice-input-volume)
- `getPermissions` - [Link 🔗](../features/permissions.md#permissions)
- `getSupportedLocalesIOS` - [Link 🔗](../features/supported-locales.md#ios)

### With React Navigation

React Navigation **doesn’t unmount screens** when you navigate — the screen can stay mounted in the background and come back without remounting. See: [Navigation lifecycle (React Navigation)](https://reactnavigation.org/docs/8.x/navigation-lifecycle/#summary).

Because of that, prefer tying recognition cleanup to **focus state**, not just component unmount. A simple approach is `useIsFocused()` and passing it into `useRecognizer`’s `destroyDeps` so recognition stops when the screen blurs. See: [`useIsFocused` (React Navigation)](https://reactnavigation.org/docs/8.x/use-is-focused).

### Example

```typescript
// From React Navigation
const isFocused = useIsFocused();

const {
  // The methods to control the session
    prewarm,
    startListening, 
    stopListening, 
    resetAutoFinishTime, 
    addAutoFinishTime, 
    updateConfig,
    getIsActive,
    getVoiceInputVolume,
    getPermissions,
    getSupportedLocalesIOS,
  } = useRecognizer(
    // Set up the callbacks
    {
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
        console.log('Error code:', error);
        console.log('Message:', ErrorDictionary[error].message);
      },
      onPermissionDenied: () => {
        console.log('Permission denied');
      },
      onVolumeChange: (volume) => {
        console.log('Volume:', volume);
      },
    },
    // Declare the destroy dependencies
    [
      isFocused,
    ]
  );

const handleStartListening = () => {
  startListening({
    // Universal
    locale: "en-US",
    contextualStrings: ['custom', 'words'],
    maskOffensiveWords: false,
    // Mutable properties
    // Finish recognition after 12 seconds of silence
    autoFinishRecognitionMs: 12000,
    // Trigger onAutoFinishProgress every 1 second
    autoFinishProgressIntervalMs: 1000,
    // Reset the timer when the voice level is above 0.4
    resetAutoFinishVoiceSensitivity: 0.4,
    disableRepeatingFilter: false,
    // Haptic feedback when the microphone starts recording
    startHapticFeedbackStyle: 'medium',
    // Haptic feedback when the microphone stops recording
    stopHapticFeedbackStyle: 'light',
    // iOS specific, non-mutable
    iosAddPunctuation: true,
    iosPreset: 'general',
    iosAtypicalSpeech: false,
    // Android specific, non-mutable
    androidFormattingPreferQuality: false,
    androidUseWebSearchModel: false,
    androidDisableBatchHandling: false,
  });

  // or from other runtimes
  scheduleOnRuntime(workletRuntime, () => {
    startListening({
      // your config...
    });
  });

  scheduleOnUI(() => {
    startListening({
      // your config...
    });
  });
};

// Free to use everything else
```

#### RecognizerRef

If you need to call recognizer methods from other components without prop drilling, use `RecognizerRef`.

```typescript
// From other components

// Prewarm for the given configuration
RecognizerRef.prewarm(
  {
    // Important parameters to choose the model for iOS
    locale: 'en-US',
    iosPreset: 'speed',
    // your config...
  },
  { 
    // Skip requesting permission
    requestPermission: false 
  }
);

// Update config during active session
RecognizerRef.updateConfig(
  {
    // Set auto-finish to 12 seconds, 500ms interval, 0.65 sensitivity
    autoFinishRecognitionMs: 12000,
    autoFinishProgressIntervalMs: 500,
    resetAutoFinishVoiceSensitivity: 0.65,
  }, 
  true // Reset auto-finish time to the new config
);

RecognizerRef.resetAutoFinishTime();

// Add 5 seconds to the auto-finish time once without changing the timer threshold
RecognizerRef.addAutoFinishTime(5000);
// Reset the auto-finish time to the current auto-finish time
RecognizerRef.addAutoFinishTime();


// Each method available from UI and custom runtimes

const workletRuntime = createWorkletRuntime({ name: 'background' });

scheduleOnRuntime(workletRuntime, () => {
  // Background worklet scope...
  // PermissionStatus enum: 0: GRANTED, 1: DENIED, 2: NOT_REQUESTED
  const permissions = RecognizerRef.getPermissions();
  console.log('Permissions:', permissions);
  // Array of supported locales, empty array on Android
  const supportedLocalesIOS = RecognizerRef.getSupportedLocalesIOS();
  console.log('Supported locales:', supportedLocalesIOS);
});

scheduleOnUI(() => {
  // UI thread scope...
  const isActive = RecognizerRef.getIsActive();
  console.log('Is active:', isActive);
  // VolumeChangeEvent object: { smoothedVolume: number, rawVolume: number, db: number | undefined }
  const volumeEvent = RecognizerRef.getVoiceInputVolume();
  console.log('Volume:', volumeEvent);
});


```