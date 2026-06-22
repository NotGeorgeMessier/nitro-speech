import { SpeechRecognitionError } from '../specs/Errors'

interface Error {
  code: SpeechRecognitionError
  message: string
}

/**
 * Dictionary of error codes and messages for the Speech Recognition.
 *
 * {@linkcode Error.message} - The human-readable message of the error.
 */
export const ErrorDictionary: Record<SpeechRecognitionError, Error> = {
  [SpeechRecognitionError.Unknown]: {
    code: SpeechRecognitionError.Unknown,
    message: 'Unknown error',
  },
  [SpeechRecognitionError.LocaleNotSupported]: {
    code: SpeechRecognitionError.LocaleNotSupported,
    message: 'Locale is not supported',
  },
  [SpeechRecognitionError.RecognitionTaskFailed]: {
    code: SpeechRecognitionError.RecognitionTaskFailed,
    message: 'Speech Recognition has started but failed',
  },
  [SpeechRecognitionError.IosSpeechPermissionNotDetermined]: {
    code: SpeechRecognitionError.IosSpeechPermissionNotDetermined,
    message:
      'Speech Recognition permission is not determined, your device does not support it',
  },
  [SpeechRecognitionError.SessionStartFailed]: {
    code: SpeechRecognitionError.SessionStartFailed,
    message: 'Speech Recognition failed to start',
  },
}
