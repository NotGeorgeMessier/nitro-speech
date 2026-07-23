# On-Device Speech Recognition (Early Preview)

Prefer or require recognition that runs on the device (no network speech service).

This is an **early preview**. Behavior differs by OS version and OEM.

---

## Mental model (layers)

On-device is three separate concerns. Do not collapse them into one boolean.

| Layer | Question | API |
| --- | --- | --- |
| **Service** | Does this device have an on-device recognition engine? | `onDeviceRecognitionAvailable(locale?)` |
| **Locales** | Which languages are supported / already installed? | `getSupportedLocales()` |
| **Assets** | Is the model for this locale ready (download if needed)? | `prewarm` / `startListening` with `onDevice` |

| Engine | Service availability | Model download | Locale readiness |
| --- | --- | --- | --- |
| `SFSpeechRecognizer` (iOS) | `.supportsOnDeviceRecognition` | usually preloaded | `supportedLocales` |
| `SpeechTranscriber` (iOS 26+) | service available when framework is | auto via `AssetInventory` | `supportedLocales` |
| `DictationTranscriber` (iOS 26+) | same | auto via `AssetInventory` | `supportedLocales` |
| Android on-device SR | `isOnDeviceRecognitionAvailable` | `triggerModelDownload` (API 33+, OEM-dependent) | `checkRecognitionSupport` (API 33+) |
---

## Config: `onDevice`

```typescript
type OnDeviceMode = 'prefer' | 'require'

interface SpeechRecognitionConfig {
  // ...
  /**
   * Prefer or require on-device speech recognition.
   *
   * Defaults
   * - iOS 26+: "prefer"
   * - iOS <26: disabled
   * - Android: disabled
   */
  onDevice?: OnDeviceMode
}
```

| Mode | Behavior |
| --- | --- |
| `undefined` / omitted | Platform default (see above). Offline path not forced. |
| `"prefer"` | Use on-device when service + model allow; otherwise fall back (iOS → next engine / network SF; Android → default network recognizer). |
| `"require"` | On-device only. No fallback. Fail via `onError` if impossible. |

Passed to `prewarm` / `startListening` like other config fields.

---

## Expected behavior

### `prefer`

1. If on-device **service** is missing → fall back.
2. If service OK but **model** missing → try install in `prewarm` / `startListening`.
3. If install succeeds → on-device session.
4. If install fails / canceled / unavailable → fall back (no error from on-device alone).

### `require`

1. If on-device **service** is missing → `SpeechRecognitionError.OnDeviceNotSupported`.
2. If service OK but **model** missing → try install.
3. If install fails / canceled / still missing → `SpeechRecognitionError.OnDeviceModelNotInstalled`.
4. If ready → on-device session only.

### Errors

| Code | When |
| --- | --- |
| `SpeechRecognitionError.OnDeviceNotSupported` | `require` and device has no on-device recognition service. |
| `SpeechRecognitionError.OnDeviceModelNotInstalled` | `require` and locale model is not installed (download failed, canceled, or not possible). |

Use `ErrorDictionary` for messages. Delivered via `onError` (including failed `prewarm` on Android when `require` cannot prepare the model).

---

## Built API

### `onDeviceRecognitionAvailable(locale?: string): boolean`

**Service-layer only.** Does not prove the locale model is installed.

- **iOS:** probes `SFSpeechRecognizer` for `locale` (default `"en-US"`). If that supports on-device → `true`. On iOS 26+, also `true` when `SpeechTranscriber` is available (assets are separate).
- **Android:** `SpeechRecognizer.isOnDeviceRecognitionAvailable` (API 31+). `locale` ignored.

```typescript
const ok = RecognizerRef.onDeviceRecognitionAvailable()
// or
const ok = RecognizerRef.onDeviceRecognitionAvailable('en-US')
```

### `getSupportedLocales(): Promise<SupportedLocales>`

```typescript
interface SupportedLocales {
  /** Supported, including downloadable / not yet installed */
  locales: string[]
  /** Ready without download */
  installedLocales: string[]
}
```

- **iOS:** union of SF (+ Speech/Dictation on iOS 26+). `installedLocales` ≈ SF packs (preloaded). Speech/Dictation install via `AssetInventory` during prewarm.
- **Android:** via on-device `checkRecognitionSupport` (API 33+). Below API 33 → empty lists (service may still exist).

```typescript
const { locales, installedLocales } = await RecognizerRef.getSupportedLocales()
```

### `getSupportedLocalesIOS(): string[]` (deprecated)

Kept for compatibility. Prefer `getSupportedLocales()`. Empty on Android.

### `prewarm` / `startListening`

With `onDevice` set:

- **iOS:** SF path sets `requiresOnDeviceRecognition` when supported; Speech/Dictation download assets via `AssetInventory` in engine prewarm.
- **Android:** uses `createOnDeviceSpeechRecognizer` when on-device is selected (not `EXTRA_PREFER_OFFLINE`). On API 33+, may call `triggerModelDownload` if the locale pack is missing (OEM may show a system dialog — or nothing).

---

## Platform notes

### iOS

| Engine | On-device |
| --- | --- |
| `SFSpeechRecognizer` | Explicit `requiresOnDeviceRecognition` when service supports it. |
| `SpeechTranscriber` / `DictationTranscriber` (iOS 26+) | On-device by nature; models via `AssetInventory.downloadAndInstall()` in prewarm. |

### Android

| API | Service check | Locale lists | Model download UI | `require` / `prefer` when service OK |
| --- | --- | --- | --- | --- |
| &lt; 31 | no | empty | — | `require` → `SpeechRecognitionError.OnDeviceNotSupported`; `prefer` → fallback |
| 31–32 | yes | empty | none (no APIs) | use on-device recognizer **without** pack verification |
| 33 | yes | `checkRecognitionSupport` | `triggerModelDownload` *might* show UI (often no-op on OEMs) | download attempt → then on-device / fallback / error |
| 34+ | yes | same | download listener + dialog; cancel often has no callback (detected via Activity resume) | same |

**Not used:** `RecognizerIntent.EXTRA_PREFER_OFFLINE`. On-device means `createOnDeviceSpeechRecognizer`.

Manual “open Voice Input Settings” install UI is **disabled** for now (may return later behind a prewarm-only option).

---

## Usage

```typescript
const {
  prewarm,
  startListening,
  onDeviceRecognitionAvailable,
  getSupportedLocales,
} = useRecognizer({
  onError: (error) => {
    // SpeechRecognitionError.OnDeviceNotSupported
    // SpeechRecognitionError.OnDeviceModelNotInstalled
    // ...
  },
  onResult: (batches) => { /* ... */ },
})

if (!onDeviceRecognitionAvailable()) {
  // no on-device service — prefer will fall back; require will error
}

const { locales, installedLocales } = await getSupportedLocales()

await prewarm({
  locale: 'en-US',
  onDevice: 'require', // or 'prefer'
})

startListening({
  locale: 'en-US',
  onDevice: 'require',
})
```

Or via `RecognizerRef` (same method names).

---

## Checklist for apps

1. Call `onDeviceRecognitionAvailable()` if you need a service gate.
2. Call `getSupportedLocales()` to see installed vs downloadable (Android: meaningful on API 33+).
3. Prefer `prewarm({ onDevice, locale })` before first listen so model download can finish.
4. Choose `prefer` vs `require` based on whether offline is optional or mandatory.
5. Handle `SpeechRecognitionError.OnDeviceNotSupported` and `SpeechRecognitionError.OnDeviceModelNotInstalled` in `onError`.
