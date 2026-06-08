# Is recognizer active

Small utility for recognizer active state.

## Lifecycle

- `useRecognizerIsActive` - Hook
- `getIsActive` - Static method
- `onReadyForSpeech` - Callback that triggers isActive state change to true
- `onRecordingStopped` - Callback that triggers isActive state change to false

## Hook useRecognizerIsActive

Subscribes to isActive state changes.

```typescript
const isActive = useRecognizerIsActive();
return <Text>{isActive ? 'Listening...' : 'Not listening'}</Text>;
```

## Static method getIsActive

```typescript
// From the static reference
const isActive = RecognizerRef.getIsActive();

// From the hybrid object, 
// Not recommended. Direct access to the hybrid object. Not safe. Only for advanced usage.
const isActive = SpeechRecognizer.getIsActive();
```

## Callbacks onReadyForSpeech and onRecordingStopped

```typescript
// From the hook
const {
  // other methods...
} = useRecognizer(
  {
    // other callbacks...
    onReadyForSpeech: () => {
      // Internal logic for active state
    },
    onRecordingStopped: () => {
      // Internal logic for inactive state
    },
  },
  // destroy deps...
);


// From the hybrid object, 
// Not recommended. Direct access to the hybrid object. Not safe. Only for advanced usage.
SpeechRecognizer.onReadyForSpeech = () => {
  // when orchestrating the session from the hybrid object,
  // custom hooks aren't wired up yet, so you need to add this handler
  // manually to enable useRecognizerIsActive hook
  speechRecognizerActiveStateHandler(true);

  // Internal logic for active state
};
SpeechRecognizer.onRecordingStopped = () => {
  // when orchestrating the session from the hybrid object,
  // custom hooks aren't wired up yet, so you need to add this handler
  // manually to enable useRecognizerIsActive hook
  speechRecognizerActiveStateHandler(false);
  
  // Internal logic for inactive state
};
```