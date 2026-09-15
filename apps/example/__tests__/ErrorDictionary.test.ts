/**
 * P0 Unit Tests for ErrorDictionary
 *
 * These tests run without a device/emulator using standard Jest.
 * They test the pure JavaScript/TypeScript pieces of the library.
 */

import { ErrorDictionary, SpeechRecognitionError } from 'react-native-nitro-speech'

describe('ErrorDictionary', () => {
  it('exports ErrorDictionary object', () => {
    expect(ErrorDictionary).toBeDefined()
    expect(typeof ErrorDictionary).toBe('object')
  })

  it('has entry for SpeechRecognitionError.Unknown', () => {
    const entry = ErrorDictionary[SpeechRecognitionError.Unknown]
    expect(entry).toBeDefined()
    expect(entry.code).toBe(SpeechRecognitionError.Unknown)
    expect(entry.message).toBe('Unknown error')
  })

  it('has entry for SpeechRecognitionError.LocaleNotSupported', () => {
    const entry = ErrorDictionary[SpeechRecognitionError.LocaleNotSupported]
    expect(entry).toBeDefined()
    expect(entry.code).toBe(SpeechRecognitionError.LocaleNotSupported)
    expect(entry.message).toBe('Locale is not supported')
  })

  it('has entry for SpeechRecognitionError.RecognitionTaskFailed', () => {
    const entry = ErrorDictionary[SpeechRecognitionError.RecognitionTaskFailed]
    expect(entry).toBeDefined()
    expect(entry.code).toBe(SpeechRecognitionError.RecognitionTaskFailed)
    expect(entry.message).toBe('Speech Recognition has started but failed')
  })

  it('has entry for SpeechRecognitionError.IosSpeechPermissionNotDetermined', () => {
    const entry = ErrorDictionary[SpeechRecognitionError.IosSpeechPermissionNotDetermined]
    expect(entry).toBeDefined()
    expect(entry.code).toBe(SpeechRecognitionError.IosSpeechPermissionNotDetermined)
    expect(entry.message).toContain('Speech Recognition permission is not determined')
  })

  it('has entry for SpeechRecognitionError.SessionStartFailed', () => {
    const entry = ErrorDictionary[SpeechRecognitionError.SessionStartFailed]
    expect(entry).toBeDefined()
    expect(entry.code).toBe(SpeechRecognitionError.SessionStartFailed)
    expect(entry.message).toBe('Speech Recognition failed to start')
  })

  it('all error codes have unique messages', () => {
    const messages = new Set<string>()
    const errorCodes = [
      SpeechRecognitionError.Unknown,
      SpeechRecognitionError.LocaleNotSupported,
      SpeechRecognitionError.RecognitionTaskFailed,
      SpeechRecognitionError.IosSpeechPermissionNotDetermined,
      SpeechRecognitionError.SessionStartFailed,
    ]

    for (const code of errorCodes) {
      const entry = ErrorDictionary[code]
      expect(messages.has(entry.message)).toBe(false)
      messages.add(entry.message)
    }
  })

  it('all entries have consistent structure', () => {
    const errorCodes = [
      SpeechRecognitionError.Unknown,
      SpeechRecognitionError.LocaleNotSupported,
      SpeechRecognitionError.RecognitionTaskFailed,
      SpeechRecognitionError.IosSpeechPermissionNotDetermined,
      SpeechRecognitionError.SessionStartFailed,
    ]

    for (const code of errorCodes) {
      const entry = ErrorDictionary[code]

      // Structure check
      expect(entry).toHaveProperty('code')
      expect(entry).toHaveProperty('message')

      // Type check
      expect(typeof entry.code).toBe('number')
      expect(typeof entry.message).toBe('string')

      // Code matches key
      expect(entry.code).toBe(code)

      // Message is non-empty
      expect(entry.message.length).toBeGreaterThan(0)
    }
  })
})

describe('SpeechRecognitionError enum', () => {
  it('exports SpeechRecognitionError enum', () => {
    expect(SpeechRecognitionError).toBeDefined()
  })

  it('has expected numeric values', () => {
    expect(SpeechRecognitionError.Unknown).toBe(0)
    expect(SpeechRecognitionError.LocaleNotSupported).toBe(1)
    expect(SpeechRecognitionError.RecognitionTaskFailed).toBe(2)
    expect(SpeechRecognitionError.IosSpeechPermissionNotDetermined).toBe(3)
    expect(SpeechRecognitionError.SessionStartFailed).toBe(4)
  })

  it('can reverse lookup from number to name', () => {
    expect(SpeechRecognitionError[0]).toBe('Unknown')
    expect(SpeechRecognitionError[1]).toBe('LocaleNotSupported')
    expect(SpeechRecognitionError[2]).toBe('RecognitionTaskFailed')
    expect(SpeechRecognitionError[3]).toBe('IosSpeechPermissionNotDetermined')
    expect(SpeechRecognitionError[4]).toBe('SessionStartFailed')
  })

  it('has exactly 5 error codes', () => {
    // Count numeric keys (enum values)
    const numericKeys = Object.keys(SpeechRecognitionError).filter(
      (key) => !isNaN(Number(key))
    )
    expect(numericKeys).toHaveLength(5)
  })
})

describe('Android silence error documentation', () => {
  /**
   * IMPORTANT: This test documents the Android silence error that fires
   * on emulators after ~4-5 seconds of silence.
   *
   * Native Android: SpeechRecognizer.ERROR_SPEECH_TIMEOUT = 6
   * Native message: "No speech input"
   * Library mapping: SpeechRecognitionError.RecognitionTaskFailed
   *
   * See RecognitionListenerSession.kt:onError() for the mapping.
   */
  it('RecognitionTaskFailed is the silence error code', () => {
    const silenceErrorCode = SpeechRecognitionError.RecognitionTaskFailed
    expect(silenceErrorCode).toBe(2)

    const entry = ErrorDictionary[silenceErrorCode]
    expect(entry.message).toBe('Speech Recognition has started but failed')
  })
})
