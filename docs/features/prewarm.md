# Prewarm

Prewarm the speech recognition engine and the model for the given parameters.

## Sync vs Async

Prewarm is async by definition, but most of the cases you can run it synchronously.

`await` for the response doesn't give you much information. If `prewarm` fails, `onError` callback will be called.

You can `await` if you need to react to the success instantly.

Also, if prewarm hasn't finished, `startListening` will interrupt preparing and proceed with starting the session without any delays or errors.

### Options

Exposed options from `SpeechRecognitionPrewarm` interface.

- `requestPermission` — Request permission to use the microphone (and speech recognition on iOS). Default: `true`.
- `loadOnDeviceModel` — Try to download / install the on-device locale model during prewarm. Default: `true` (but no-op without `onDevice`).

## Load on-device model

`loadOnDeviceModel` only runs when `defaultParams.onDevice` is `"prefer"` or `"require"`. If `onDevice` is omitted, this step is ignored.

| `onDevice` | `loadOnDeviceModel` | Effect |
| --- | --- | --- |
| unset | any | Ignored. No on-device model work. |
| `"prefer"` | `true` (default) | Try to load the model; on failure fall back to the remote / default engine. |
| `"require"` | `true` (default) | Load the model, or fail with `OnDeviceNotSupported` / `OnDeviceModelNotInstalled`. |
| `"prefer"` / `"require"` | `false` | Skip the download/install step in prewarm (iOS 26+ Speech/Dictation `AssetInventory`). |

See [On-device speech recognition](./on-device.md) for `prefer` vs `require`, locale queries, and platform notes.

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
- `onDevice: "require"` and on-device service / model is unavailable

Possible codes: `LocaleNotSupported`, `SessionStartFailed`, `IosSpeechPermissionNotDetermined`, `OnDeviceNotSupported`, `OnDeviceModelNotInstalled` (see `ErrorDictionary`).

## Android

Responsibility:
- Request permission to use the microphone if `requestPermission` is not disabled
- When `onDevice` is set, prepare the on-device recognizer (may trigger a system model-download UI on API 33+)

Triggers `onError` callback if fails.
- request permission isn't disabled but denied
- `onDevice: "require"` and on-device service is missing → `OnDeviceNotSupported`
- `onDevice: "require"` and locale model is not installed → `OnDeviceModelNotInstalled`

Possible codes: `OnDeviceNotSupported`, `OnDeviceModelNotInstalled` (see `ErrorDictionary`).

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
  onDevice: 'prefer',
  // ... your config to prepare
}, {
  requestPermission: false,
  loadOnDeviceModel: true, // default; no-op unless onDevice is set
});

// From the hybrid object, 
// Not recommended. Direct access to the hybrid object. Not safe. Only for advanced usage.
SpeechRecognizer.prewarm({
  locale: 'en-US',
  // ... your config to prepare
});
```
