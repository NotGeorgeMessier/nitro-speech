# Supported locales

Locales are the identifiers for languages.

Some examples:
- `en-US` - English (United States)
- `en-GB` - English (Great Britain)
- `fr-FR` - French (France)
- `de-DE` - German (Germany)

### Pattern: `en_US` or `en-US` ?

Doesn't matter. Dash or underscore, both are valid.

## Cross-platform: `getSupportedLocales()`

Use `getSupportedLocales(): Promise<SupportedLocales>` on both iOS and Android.

```typescript
interface SupportedLocales {
  /** Supported, including downloadable / not yet installed */
  locales: string[]
  /** Ready to use without download */
  installedLocales: string[]
}
```

This is the on-device locale report. It is not a guarantee that a network recognizer will accept every language on every OEM.

## iOS

iOS supports 60+ locales.

Legacy `SFSpeechRecognition` model supports the majority of these locales and is available on all iOS versions.

Starting iOS 26, `SpeechTranscriber` and `DictationTranscriber` are the new models available.

Features support see [Real-time transcription](./real-time-transcription.md)

- `SpeechTranscriber` supports the most popular languages, around 10-20 locales, targets highest accuracy
- `DictationTranscriber` supports more locales and some unusual variations, provides less accuracy but more speed

Based on your `locale` param in configuration (and few other notable properties) for `startListening` or `prewarm` methods, the library will select the best available model.

`getSupportedLocales()` returns the union of SF locales plus Speech/Dictation locales on iOS 26+. `installedLocales` is the SF pack list (preloaded). Speech/Dictation assets install via `AssetInventory` during [prewarm](./prewarm.md).

## Android

`getSupportedLocales()` queries on-device recognition support via `checkRecognitionSupport` (API 33+).

- **API 33+** with an on-device service: `locales` (supported, including downloadable) and `installedLocales` (ready without download).
- **Below API 33**, or if the on-device service is missing: both lists are empty. The device may still have a network recognizer.

See [On-device speech recognition](./on-device.md) for service checks (`onDeviceRecognitionAvailable`) vs locale readiness.

## Fallback

If locale is not supported
- Session won't be started
- `onError` callback will be called with `SpeechRecognitionError.LocaleNotSupported` (use `ErrorDictionary` for the message)

## Usage

```typescript
// From the hook
const {
  // other methods...
  getSupportedLocales,
} = useRecognizer(
  // your callbacks...
  // destroy deps...
);

const { locales, installedLocales } = await getSupportedLocales();

// From the static reference
const supported = await RecognizerRef.getSupportedLocales();

// From the hybrid object,
// Not recommended. Direct access to the hybrid object. Not safe. Only for advanced usage.
const supported = await SpeechRecognizer.getSupportedLocales();
```

### `getSupportedLocalesIOS()` (deprecated) {#getsupportedlocalesios-deprecated}

Prefer `getSupportedLocales()`. Kept for compatibility.

```typescript
const supportedLocalesIOS = RecognizerRef.getSupportedLocalesIOS();
```

Returns an empty array on Android.
