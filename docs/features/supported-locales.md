# Supported locales

Locales are the identifiers for languages.

Some examples:
- `en-US` - English (United States)
- `en-GB` - English (Great Britain)
- `fr-FR` - French (France)
- `de-DE` - German (Germany)

### Pattern: `en_US` or `en-US` ?

Doesn't matter. Dash or underscore, both are valid.

## iOS

iOS supports 60+ locales.

Legacy `SFSpeechRecognition` model supports the majority of these locales and is available on all iOS versions.

Starting iOS 26, `SpeechTranscriber` and `DictationTranscriber` are the new models available.

Features support see [Real-time transcription](./real-time-transcription.md)

- `SpeechTranscriber` supports the most popular languages, around 10-20 locales, targets highest accuracy
- `DictationTranscriber` supports more locales and some unusual variations, provides less accuracy but more speed

Based on your `locale` param in configuration (and few other notable properties) for `startListening` or `prewarm` methods, the library will select the best available model.

## Android

Android doesn't expose any API for supported locales.

Depends on the device and OS version.

## Fallback

If locale is not supported
- Session won't be started
- `onError` callback will be called with `SpeechRecognitionError.LocaleNotSupported` (use `ErrorDictionary` for the message)

## Usage

Get the list of supported locales via `getSupportedLocalesIOS(): string[]`

*Returns empty array on Android*

```typescript
// From the hook
const { 
  // other methods...
  getSupportedLocalesIOS,
} = useRecognizer(
  // your callbacks...
  // destroy deps...
);

// From the static reference
const supportedLocales = RecognizerRef.getSupportedLocalesIOS();

// From the hybrid object, 
// Not recommended. Direct access to the hybrid object. Not safe. Only for advanced usage.
const supportedLocales = SpeechRecognizer.getSupportedLocalesIOS().sort();
```