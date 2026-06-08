# Worklets

All methods are thread-safe and can be called from UI thread or custom worklets.

## Usage

- Methods from the hook `useRecognizer` have "worklet" directive
- Methods from the static reference `RecognizerRef` have "worklet" directive
- Everything from the hybrid object `SpeechRecognizer` doesn't need a "worklet" directive and accessible from any runtime thanks to Nitro Modules architecture ([Nitro Threading](https://nitro.margelo.com/docs/guides/worklets)).

```typescript
// Your new worklet runtime
const workletRuntime = createWorkletRuntime({ name: 'background' });


const { updateConfig, getVoiceInputVolume } = useRecognizer(
  {
    // your callbacks...
  },
  // destroy deps...
);

// Schedule it from anywhere
scheduleOnRuntime(workletRuntime, () => {
  // Background worklet scope...
  updateConfig({
    // your new config...
  });
});

// Or run with reanimated API on UI thread like
useAnimatedStyle(() => {
  // UI thread scope...

  // Works
  getVoiceInputVolume();

  // Or RecognizerRef static reference
  RecognizerRef.getVoiceInputVolume();
}

// Or other UI thread approaches (from react-native-worklets)
// This is JS runtime, but getVoiceInputVolume will be executed on UI thread and return the result to the JS runtime.
const volumeEvent = runOnUISync(SpeechRecognizer.getVoiceInputVolume);

```