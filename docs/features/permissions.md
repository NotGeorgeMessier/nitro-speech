# Permissions

## Installation

### Android

No actions required.
The library manifest already declares `RECORD_AUDIO` and `VIBRATE` (merged automatically), and an `android.speech.RecognitionService` query:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.VIBRATE" />

<queries>
  <intent>
    <action android:name="android.speech.RecognitionService" />
  </intent>
</queries>
```

### iOS

Expo: see the [README Expo section](https://github.com/NotGeorgeMessier/nitro-speech#expo). `npx expo install react-native-nitro-speech` adds the plugin to `app.json` automatically.

`microphonePermission` sets `NSMicrophoneUsageDescription` (default `This app needs microphone access for speech recognition`). `speechRecognitionPermission` sets `NSSpeechRecognitionUsageDescription` (default `This app needs speech recognition to convert speech to text`). Omit an option to keep an existing value from `ios.infoPlist` or a hand-edited Info.plist (only with `npx expo prebuild --no-clean`; app.json wins if both set the same key); otherwise the default is used. A non-empty string replaces the value. `false` removes the key, but do not use it here: both keys are required on iOS, and the app terminates at the permission request without them. Run `npx expo prebuild` again after changing options.

Bare React Native: add the following keys to your app's `Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access for speech recognition</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>This app needs speech recognition to convert speech to text</string>
```

Both permissions are required for speech recognition to work on iOS.

Modify `<string>` value to match your app's purpose.

## Lifecycle

- Optional: request permission via `prewarm`, see [Prewarm options](./prewarm.md#options)
- Automatically request permission via `startListening`.
- Static method `getPermissions()` to get the current permission status.
- Callback `onPermissionDenied` if permission is denied.

### iOS

Requesting permission on iOS includes requesting the speech recognition permission first and then the microphone permission.

If any failure happens, the permission status will be `DENIED` and `onPermissionDenied` will be called.

## Usage

### prewarm 

See [Prewarm usage](./prewarm.md#usage)

### startListening

Automatically requests permission, nothing to configure.

### getPermissions

Get the `SpeechRecognitionPermissionStatus` enum:
- `0` - Granted
- `1` - Denied
- `2` - Not requested

```typescript
// From the hook
const {
  // other methods
  getPermissions,
} = useRecognizer(
  // callbacks
  // destroy deps
)

// From the static reference
RecognizerRef.getPermissions()

// From the hybrid object, 
// Not recommended. Direct access to the hybrid object. Not safe. Only for advanced usage.
SpeechRecognizer.getPermissions()
```

### onPermissionDenied

Callback that triggers when permission is denied.

```typescript
const {
  // other methods...
} = useRecognizer(
  {
    // other callbacks...
    onPermissionDenied: () => {
      // Your logic here
    },
  },
  // destroy deps
)
```