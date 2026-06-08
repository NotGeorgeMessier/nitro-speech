# Update config

Update the config on the fly (during active session).

### Options

Exposed options from `MutableSpeechRecognitionConfig` interface.

If an option is not provided, the current config value or default value is used.

## Usage

```typescript
// From the hook
const {
  // other methods...
  updateConfig,
} = useRecognizer(
  // your callbacks...
  // destroy deps...
);

// From the static reference
RecognizerRef.updateConfig({
  // your new config...
});

// From the hybrid object, 
// Not recommended. Direct access to the hybrid object. Not safe. Only for advanced usage.
SpeechRecognizer.updateConfig({
  // your new config...
});
```