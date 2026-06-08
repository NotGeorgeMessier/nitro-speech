# Speech Recognizer Session

There are 2 ways to orchestrate the speech recognizer session:

1. Hook `useRecognizer` as initializer and `RecognizerRef` for safe cross-component access
2. Manually wire up everything using the `SpeechRecognizer` hybrid object

This is an example of how to initialize the session using the `SpeechRecognizer` hybrid object:

## SpeechRecognizer

`SpeechRecognizer` is the hybrid object. It gives the direct access to all callbacks and control methods.

It gives all the power and might be used for advanced scenarios, but it's also unsafe to orchestrate the full session directly from it since you may forget about some important parts

**Note**: `SpeechRecognizer` is not connected to the React Lifecycle, you can use it anywhere including outside of the components.

**Warning**: Since it reflects the original hybrid object, its API may change in the future.

### Callbacks

Each callback is optional.

**Note**: When orchestrating the session from the hybrid object, custom hooks aren't wired up yet, so you need to add handlers manually into the callbacks if you want to use hooks.

- `speechRecognizerActiveStateHandler` - Handler for `useRecognizerIsActive` hook, more details [here](../features/is-recognizer-active.md)
- `speechRecognizerVolumeChangeHandler` - Handler for `useVoiceInputVolume` hook, more details [here](../features/voice-input-volume.md)

```typescript
SpeechRecognizer.onReadyForSpeech = () => {
  // Wire up when session starts
  speechRecognizerActiveStateHandler(true);
  // Internal logic for session start
  console.log('Listening...');
};

SpeechRecognizer.onRecordingStopped = () => {
  // Wire up when session stops
  speechRecognizerActiveStateHandler(false);
  // Internal logic for session stop
  console.log('Stopped');
};

SpeechRecognizer.onVolumeChange = (volume) => {
  // Wire up when volume changes
  speechRecognizerVolumeChangeHandler(volume);
  // Internal logic for volume change event
  console.log('Volume:', volume);
};
```

Other callbacks don't require any additional handling.

```typescript
SpeechRecognizer.onResult = (textBatches) => {
  console.log('Result:', textBatches.join('\n'));
};

SpeechRecognizer.onAutoFinishProgress = (timeLeftMs) => {
  console.log('Auto-stop in:', timeLeftMs, 'ms');
};

SpeechRecognizer.onError = (message) => {
  console.log('Error:', message);
};

SpeechRecognizer.onPermissionDenied = () => {
  console.log('Permission denied');
};
```

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

```typescript
// Start from anywhere
SpeechRecognizer.startListening({
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
});

// Stop from anywhere
SpeechRecognizer.stopListening();
```

```typescript
// Prewarm from anywhere for the given configuration
SpeechRecognizer.prewarm(
  {
    locale: 'en-US',
    // ... your config to prepare
  },
  // Prewarm config, optional
  { 
    requestPermission: true
  }
);

// Update config from anywhere
SpeechRecognizer.updateConfig(
  {
    // ... your new config
  },
  true // Reset auto finish time to the new config
);

// Add auto finish time
SpeechRecognizer.addAutoFinishTime(5000);

// Reset auto finish time
SpeechRecognizer.resetAutoFinishTime();

// Get the active state
const isActive = SpeechRecognizer.getIsActive();
console.log('Is active:', isActive);

// Get the voice input volume
const volumeEvent = SpeechRecognizer.getVoiceInputVolume();
console.log('Volume:', volumeEvent)

// Get the permissions
const permissions = SpeechRecognizer.getPermissions();
console.log('Permissions:', permissions);
```

Full worklet support, see [Worklets](../features/worklets.md#worklets).

```typescript
// Schedule it from anywhere
scheduleOnRuntime(workletRuntime, () => {
  // Background worklet scope...
  SpeechRecognizer.updateConfig({
    // your new config...
  });
});

scheduleOnUI(() => {
  // UI thread scope...
  SpeechRecognizer.getVoiceInputVolume();
});
```