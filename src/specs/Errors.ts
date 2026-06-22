/**
 * Error codes for the Speech Recognition.
 *
 * Use `ErrorDictionary` to get more information about the error.
 *
 * `Unknown` - Unknown error, any unexpected error.
 *
 * `LocaleNotSupported` - Locale is not supported, see locale patterns in `docs/features/supported-locales.md` section.
 *
 * `RecognitionTaskFailed` - Speech Recognition has started but failed.
 * For Android, usually, when Recognizer has started, but didnt receive any speech from the start.
 *
 * `IosSpeechPermissionNotDetermined` - Only for iOS. Speech Recognition permission is not determined, your device does not support it.
 *
 * `SessionStartFailed` - Speech Recognition failed to start. Any internal process failed to start the session.
 * For iOS, may be caused by version incompatibility (early Beta, or too old, etc.).
 * For Android, may be caused by unexpected behavior on mid-range device or other compatibility issues.
 *
 * @note Report any unexpected behavior to the repository issues with detailed description.
 */
export enum SpeechRecognitionError {
  Unknown,
  LocaleNotSupported,
  RecognitionTaskFailed,
  IosSpeechPermissionNotDetermined,
  SessionStartFailed,
}
