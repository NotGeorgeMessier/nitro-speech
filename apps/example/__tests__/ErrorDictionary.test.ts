/**
 * Pure JS unit tests for ErrorDictionary / speech error codes.
 * These do not load the native Nitro hybrid object.
 */

import {ErrorDictionary, SpeechRecognitionError} from 'react-native-nitro-speech';

describe('ErrorDictionary', () => {
  const allCodes = [
    SpeechRecognitionError.Unknown,
    SpeechRecognitionError.LocaleNotSupported,
    SpeechRecognitionError.RecognitionTaskFailed,
    SpeechRecognitionError.IosSpeechPermissionNotDetermined,
    SpeechRecognitionError.SessionStartFailed,
    SpeechRecognitionError.OnDeviceNotSupported,
    SpeechRecognitionError.OnDeviceModelNotInstalled,
  ];

  it('has an entry for every SpeechRecognitionError', () => {
    for (const code of allCodes) {
      const entry = ErrorDictionary[code];
      expect(entry).toBeDefined();
      expect(entry.code).toBe(code);
      expect(typeof entry.message).toBe('string');
      expect(entry.message.length).toBeGreaterThan(0);
    }
  });

  it('uses unique messages', () => {
    const messages = new Set(allCodes.map(code => ErrorDictionary[code].message));
    expect(messages.size).toBe(allCodes.length);
  });

  it('documents the Android emulator silence mapping', () => {
    expect(SpeechRecognitionError.RecognitionTaskFailed).toBe(2);
    expect(ErrorDictionary[SpeechRecognitionError.RecognitionTaskFailed].message).toBe(
      'Speech Recognition has started but failed',
    );
  });
});

describe('SpeechRecognitionError enum', () => {
  it('has expected numeric values', () => {
    expect(SpeechRecognitionError.Unknown).toBe(0);
    expect(SpeechRecognitionError.LocaleNotSupported).toBe(1);
    expect(SpeechRecognitionError.RecognitionTaskFailed).toBe(2);
    expect(SpeechRecognitionError.IosSpeechPermissionNotDetermined).toBe(3);
    expect(SpeechRecognitionError.SessionStartFailed).toBe(4);
    expect(SpeechRecognitionError.OnDeviceNotSupported).toBe(5);
    expect(SpeechRecognitionError.OnDeviceModelNotInstalled).toBe(6);
  });

  it('has 7 error codes', () => {
    const numericKeys = Object.keys(SpeechRecognitionError).filter(
      key => !Number.isNaN(Number(key)),
    );
    expect(numericKeys).toHaveLength(7);
  });
});
