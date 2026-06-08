# Edge cases

## Background handling

When app goes to background, the recognizer will stop listening and release the resources.

Recognizer will gracefully stop. No error will be thrown. Recognition might be started again with prewarmed model.

## ⚠️ Dispose

The `SpeechRecognizer.dispose()` method is **NOT SAFE** and should rarely be used. `SpeechRecognizer` isn't a recyclable hybrid object and once disposed it can't be recreated.

Hybrid Objects in Nitro are typically managed by the JS garbage collector automatically. Only call `dispose()` in performance-critical scenarios where you need to eagerly destroy objects.

**See:** [Nitro dispose() documentation](https://nitro.margelo.com/docs/hybrid-objects#dispose)

## Combining approaches

As you know, the recommended approach is to use `useRecognizer` hook and `RecognizerRef` static reference. And `SpeechRecognizer` hybrid object direct calls are better for advanced usage.

However, you can combine both approaches to get the best of both worlds.

### Example

Initialize the session with `useRecognizer` hook and `RecognizerRef` for other methods.

```typescript
const {
  // other methods...
} = useRecognizer(
  // your callbacks...
  // destroy deps...
);

RecognizerRef.startListening({
  // your config...
});
```

And in the performance-critical situations use `SpeechRecognizer` with custom workletized functions.

```typescript
const sharedVolume = useSharedValue(0);

useEffect(() => {
  const workletizedOnVolumeChange = (event: VolumeChangeEvent) => {
    "worklet";
    sharedVolume.value = event.smoothedVolume;
  };
  SpeechRecognizer.onVolumeChange = workletizedOnVolumeChange
  return () => {
    SpeechRecognizer.onVolumeChange = undefined;
  };
}, []);
```

This will give you access to volume changes on UI thread, also avoiding re-renders.