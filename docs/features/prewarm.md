# Prewarm

Prewarm the speech recognition engine and the model for the given parameters.

## Sync vs Async

Prewarm is async by definition, but most of the cases you can run it synchronously.

`await` for the response doesn't give you much information. If `prewarm` fails, `onError` callback will be called.

You can `await` if you need to react to the success instantly.

Also, if prewarm hasn't finished, `startListening` will interrupt preparing and proceed with starting the session without any delays or errors.

### Options

Exposed options from `SpeechRecognitionPrewarm` interface.

- `requestPermission` - Request permission to use the microphone (and speech recognition on iOS)

## iOS

Responsibility:
- Performs heavy hardware format retrieval at the first call after installation
- Check the resources availability
- Check the locale availability
- Download the assets (if needed)
- Cache the config `SpeechRecognitionConfig` for `startListening`
- Request permission to use the microphone and speech recognition if `requestPermission` is not disabled

Triggers `onError` callback if fails.
- resources are unavailable
- locale is unsupported
- asset download fails
- request permission isn't disabled but denied

Possible codes: `LocaleNotSupported`, `SessionStartFailed`, `IosSpeechPermissionNotDetermined` (see `ErrorDictionary`).

## Android

Responsibility:
- Request permission to use the microphone if `requestPermission` is not disabled

Triggers `onError` callback if fails.
- request permission isn't disabled but denied

## Usage

```typescript
// From the hook
const {
  // other methods...
  prewarm,
} = useRecognizer(
  // your callbacks...
  // destroy deps...
);

// From the static reference
RecognizerRef.prewarm({
  locale: 'en-US',
  // ... your config to prepare
}, { requestPermission: false });

// From the hybrid object, 
// Not recommended. Direct access to the hybrid object. Not safe. Only for advanced usage.
SpeechRecognizer.prewarm({
  locale: 'en-US',
  // ... your config to prepare
});
```