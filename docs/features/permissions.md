# Permissions

## Installation

### Android

No actions required.
The library declares the required permission in its `AndroidManifest.xml` (merged automatically):

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### iOS

Add the following keys to your app's `Info.plist`:

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

Get the `PermissionStatus` enum:
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