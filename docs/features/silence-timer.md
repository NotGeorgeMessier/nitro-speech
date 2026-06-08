# Silence timer

Unique feature - highly customisable silence timer.

Auto-finishes the session after a configurable period of silence.

## Properties

Mutable properties from `MutableSpeechRecognitionConfig` interface for `startListening` and `updateConfig` methods.

### Auto-finish on silence

`autoFinishRecognitionMs` - Silence timer duration with no voice detected in milliseconds.

Max value:
- 300_000ms (5 minutes) for Android
- Actually, no limit for iOS

### Auto-finish progress interval

`autoFinishProgressIntervalMs` - The interval at which `onAutoFinishProgress` will be triggered in milliseconds.

Min value: 50ms

### Reset auto-finish time voice sensitivity

`resetAutoFinishVoiceSensitivity` - The voice detector sensitivity to reset the auto finish timer.

Sensitivity in range of `0.00` - `1.00`, corresponds to the `rawVolume` of the [voice input volume](./voice-input-volume.md#property-rawvolume).

## Methods

Static methods available from everywhere.

### Add auto-finish time

`addAutoFinishTime(additionalTimeMs?: number)` - Add time to the auto finish timer once without changing the timer threshold.

If not set, will reset the timer to the original `autoFinishRecognitionMs`.

Method can add time overflowing the current `autoFinishRecognitionMs`, but any reset (via the method or result detection) will reset to the current `autoFinishRecognitionMs`.

### Reset auto-finish time

`resetAutoFinishTime()` - Reset the auto finish timer to the original `autoFinishRecognitionMs`.

## Callback
### Auto-finish progress

`onAutoFinishProgress?: (timeLeftMs: number) => void` - Dedicated callback for tracking auto-finish progress. Called every `autoFinishProgressIntervalMs` milliseconds.

## Usage

### Hook

Initializing with the hook.

```typescript
const {
  startListening,
  updateConfig,
  addAutoFinishTime,
  resetAutoFinishTime,
} = useRecognizer(
  {
    // your callbacks...
    onAutoFinishProgress: (timeLeftMs) => {
      // Will be called every 1 second, after updateConfig called - every 500ms 
      // Your logic here...
    }
  },
  // destroy deps...
);

// Starting 
startListening({
  // silence timer for 12 seconds, 1 second interval, 0.4 rawVolume threshold to reset the timer
  autoFinishRecognitionMs: 12000,
  autoFinishProgressIntervalMs: 1000,
  resetAutoFinishVoiceSensitivity: 0.4,
  // your config...
});
// Updating during active session
updateConfig({
  // silence timer for 6 seconds, 500ms interval, 0.65 rawVolume threshold to reset the timer
  autoFinishRecognitionMs: 6000,
  autoFinishProgressIntervalMs: 500,
  resetAutoFinishVoiceSensitivity: 0.65,
});
```

### RecognizerRef

Triggering methods from the static reference.

`RecognizerRef` only supports methods.

To wire up callbacks and custom hooks initialize `useRecognizer` or manually wire up the callbacks to the hybrid object `SpeechRecognizer` (not recommended).

```typescript
// Starting
RecognizerRef.startListening({
  // silence timer for 12 seconds, 1 second interval, 0.4 rawVolume threshold to reset the timer
  autoFinishRecognitionMs: 12000,
  autoFinishProgressIntervalMs: 1000,
  resetAutoFinishVoiceSensitivity: 0.4,
  // your config...
});

// Adding time to the timer once without changing the timer threshold
RecognizerRef.addAutoFinishTime(5000);

// Updating during active session
RecognizerRef.updateConfig({
  // silence timer for 10 seconds, 500ms interval, 0.65 rawVolume threshold to reset the timer
  autoFinishRecognitionMs: 10000,
  autoFinishProgressIntervalMs: 500,
  resetAutoFinishVoiceSensitivity: 0.65,
});

// Resetting the timer to the original threshold
RecognizerRef.resetAutoFinishTime();
```

### SpeechRecognizer

Not recommended. Direct access to the hybrid object. Not safe. Only for advanced usage.

```typescript
SpeechRecognizer.startListening({
  // silence timer for 12 seconds, 500ms interval, 0.65 rawVolume threshold to reset the timer
  autoFinishRecognitionMs: 12000,
  autoFinishProgressIntervalMs: 500,
  resetAutoFinishVoiceSensitivity: 0.65,
  // your config...
});

SpeechRecognizer.addAutoFinishTime(5000);

SpeechRecognizer.resetAutoFinishTime();

SpeechRecognizer.onAutoFinishProgress = (timeLeftMs) => {
  // Will be called every 500ms
  // Advanced logic here...
};
```