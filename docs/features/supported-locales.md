# Supported locales

Locales are the identifiers for languages.

Some examples:
- `en-US` - English (United States)
- `en-GB` - English (Great Britain)
- `fr-FR` - French (France)
- `de-DE` - German (Germany)

### Pattern: `en_US` or `en-US` ?

Doesn't matter. Dash or underscore, both are valid.

### getSupportedLocales

```typescript
interface SupportedLocales {
  /** Supported, including downloadable / not yet installed */
  locales: string[]
  /** Ready without download */
  installedLocales: string[]
}
```

```typescript
const { locales, installedLocales } = await RecognizerRef.getSupportedLocales()
```

### `getSupportedLocalesIOS(): string[]` (deprecated)

Kept for compatibility. Prefer `getSupportedLocales()`. Empty on Android.

### iOS

iOS supports 60+ locales.

Legacy `SFSpeechRecognition` model supports the majority of these locales and is available on all iOS versions.

Starting iOS 26, `SpeechTranscriber` and `DictationTranscriber` are the new models available.

- `SpeechTranscriber` supports the most popular languages, around 10-20 locales, targets highest accuracy
- `DictationTranscriber` supports more locales and some unusual variations, provides less accuracy but more speed

Based on your `locale` param in configuration (and few other notable properties) for `startListening` or `prewarm` methods, the library will select the best available model.

### Android

`getSupportedLocales()` queries on-device recognition support via `checkRecognitionSupport` (API 33+).

- **API 33+** with an on-device service: `locales` (supported, including downloadable) and `installedLocales` (ready without download).
- **Below API 33**, or if the on-device service is missing: both lists are empty. The device may still have a network recognizer.

See [On-device speech recognition](./on-device.md) for service checks (`onDeviceRecognitionAvailable`) vs locale readiness.

### Fallback

If locale is not supported
- Session won't be started
- `onError` callback will be called with `SpeechRecognitionError.LocaleNotSupported` (use `ErrorDictionary` for the message)
