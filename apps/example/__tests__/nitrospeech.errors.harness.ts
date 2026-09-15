import { describe, expect, it, beforeEach } from 'react-native-harness'
import {
  SpeechRecognizer,
  ErrorDictionary,
  SpeechRecognitionError,
} from 'react-native-nitro-speech'
import { deferred, withTimeout } from './test-utils'

/**
 * NitroSpeech - Error Handling Harness Tests
 *
 * Tests error handling and ErrorDictionary functionality.
 * These tests verify error shapes and handling, NOT transcription accuracy.
 */
describe('NitroSpeech - Error Handling', () => {
  beforeEach(() => {
    SpeechRecognizer.onReadyForSpeech = undefined
    SpeechRecognizer.onRecordingStopped = undefined
    SpeechRecognizer.onResult = undefined
    SpeechRecognizer.onError = undefined
    SpeechRecognizer.onPermissionDenied = undefined
    SpeechRecognizer.onVolumeChange = undefined
    SpeechRecognizer.onAutoFinishProgress = undefined
  })

  it('ErrorDictionary contains all expected error codes', () => {
    // Verify all enum values have dictionary entries
    const expectedErrors = [
      SpeechRecognitionError.Unknown,
      SpeechRecognitionError.LocaleNotSupported,
      SpeechRecognitionError.RecognitionTaskFailed,
      SpeechRecognitionError.IosSpeechPermissionNotDetermined,
      SpeechRecognitionError.SessionStartFailed,
    ]

    for (const errorCode of expectedErrors) {
      const entry = ErrorDictionary[errorCode]
      expect(entry).toBeDefined()
      expect(entry.code).toBe(errorCode)
      expect(typeof entry.message).toBe('string')
      expect(entry.message.length).toBeGreaterThan(0)
    }
  })

  it('ErrorDictionary messages are human-readable', () => {
    expect(ErrorDictionary[SpeechRecognitionError.Unknown].message).toBe('Unknown error')
    expect(ErrorDictionary[SpeechRecognitionError.LocaleNotSupported].message).toBe(
      'Locale is not supported',
    )
    expect(ErrorDictionary[SpeechRecognitionError.RecognitionTaskFailed].message).toBe(
      'Speech Recognition has started but failed',
    )
    expect(ErrorDictionary[SpeechRecognitionError.SessionStartFailed].message).toBe(
      'Speech Recognition failed to start',
    )
  })

  it('SpeechRecognitionError enum has expected numeric values', () => {
    expect(SpeechRecognitionError.Unknown).toBe(0)
    expect(SpeechRecognitionError.LocaleNotSupported).toBe(1)
    expect(SpeechRecognitionError.RecognitionTaskFailed).toBe(2)
    expect(SpeechRecognitionError.IosSpeechPermissionNotDetermined).toBe(3)
    expect(SpeechRecognitionError.SessionStartFailed).toBe(4)
  })

  it('onError callback receives valid error code for unsupported locale', async () => {
    const errorDeferred = deferred<SpeechRecognitionError>()
    const stoppedDeferred = deferred()

    SpeechRecognizer.onError = (error) => {
      errorDeferred.resolve(error)
    }
    SpeechRecognizer.onRecordingStopped = () => {
      stoppedDeferred.resolve()
    }

    try {
      // Use an invalid/unsupported locale to trigger an error
      SpeechRecognizer.startListening({
        locale: 'xx-INVALID-LOCALE-XX',
        autoFinishRecognitionMs: 30000,
      })

      // Should receive an error for unsupported locale
      const error = await withTimeout(errorDeferred.promise, 10_000, 'onError')

      // The error should be LocaleNotSupported
      expect(error).toBe(SpeechRecognitionError.LocaleNotSupported)

      // Verify we can look it up in the dictionary
      const errorInfo = ErrorDictionary[error]
      expect(errorInfo).toBeDefined()
      expect(errorInfo.code).toBe(SpeechRecognitionError.LocaleNotSupported)
    } finally {
      if (SpeechRecognizer.getIsActive()) {
        SpeechRecognizer.stopListening()
        await withTimeout(stoppedDeferred.promise, 5_000, 'onRecordingStopped').catch(() => {})
      }
    }
  })

  it('error codes can be used to look up ErrorDictionary entries', () => {
    // Simulate receiving an error code from the native side
    const simulatedErrorCode = SpeechRecognitionError.RecognitionTaskFailed

    const entry = ErrorDictionary[simulatedErrorCode]
    expect(entry).toBeDefined()
    expect(entry.code).toBe(simulatedErrorCode)
    expect(entry.message).toBe('Speech Recognition has started but failed')
  })
})
