# Voice input volume

Rich user voice input management.

- Hook `useVoiceInputVolume(config)` for displaying volume in dB and making smooth UI animations;
- Static method `getVoiceInputVolume()` for getting the current voice input volume
- Callback `onVolumeChange` for advanced use cases

All returns `VolumeChangeEvent` object.

### The data `VolumeChangeEvent` explained

Represents the energy-based volume of each audio buffer.

#### property `smoothedVolume` 

Normalized to a range of 0 to 1.

Best choice for UI animations.

Smoothly changes reflecting the input volume for seamless UI effects.

#### property `rawVolume`

Normalized to a range of 0 to 1.

Reflects the actual input volume without smoothing.

Appropriate for internal logic, quick reactions, less suitable for UI.

#### property `db`

Audio buffer volume in decibels. Not smoothed.

Values will vary on different devices, however still appropriate for displaying in UI.

*db 0 is still a sound, undefined is no sound or disabled event.*

## Hook useVoiceInputVolume

Subscribes to volume changes and returns `VolumeChangeEvent` object.

- config property `eventsPerSecond` - The number of volume change events to emit per second.

Without `eventsPerSecond` hook will re-render a lot with arbitrary (high) frequency.

Recommendation: if used without limit, wrap the component in `React.memo` to avoid heavy & frequent re-renders.

```typescript
const volumeEvent = useVoiceInputVolume({
  eventsPerSecond: 5,
});
return <>
  <Text>{volumeEvent.smoothedVolume}</Text>
  <Text>{volumeEvent.rawVolume}</Text>
  <Text>{volumeEvent.db}</Text>
</>;
```

## Static method getVoiceInputVolume

```typescript
// From the static reference
const volumeEvent = RecognizerRef.getVoiceInputVolume();

// From the hybrid object, 
// Not recommended. Direct access to the hybrid object. Not safe. Only for advanced usage.
const volumeEvent = SpeechRecognizer.getVoiceInputVolume();
```

## Callback onVolumeChange

```typescript
// From the hook
const {
  // other methods...
} = useRecognizer(
  {
    // other callbacks...
    onVolumeChange: (volumeEvent) => {
      // Any additional work here...
    },
  },
  // destroy deps...
);

// From the hybrid object, 
// Not recommended. Direct access to the hybrid object. Not safe. Only for advanced usage.
SpeechRecognizer.onVolumeChange = (volumeEvent) => {
  // when orchestrating the session from the hybrid object,
  // custom hooks aren't wired up yet, so you need to add this handler
  // manually to enable useVoiceInputVolume hook
  speechRecognizerVolumeChangeHandler(volumeEvent);
  // Any additional work here...
};
```