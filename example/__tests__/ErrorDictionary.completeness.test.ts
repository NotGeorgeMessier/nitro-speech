/**
 * Completeness of ErrorDictionary vs the 4.10 SpeechRecognitionError enum.
 */

import {ErrorDictionary, SpeechRecognitionError} from 'react-native-nitro-speech';

function numericEnumValues(enumObject: object): number[] {
  return Object.keys(enumObject)
    .filter(key => !Number.isNaN(Number(key)))
    .map(Number)
    .sort((a, b) => a - b);
}

describe('ErrorDictionary completeness vs 4.10 codes', () => {
  const codes = numericEnumValues(SpeechRecognitionError);

  it('covers every numeric SpeechRecognitionError without a hardcoded allow-list', () => {
    expect(codes.length).toBeGreaterThanOrEqual(7);
    for (const code of codes) {
      const entry = ErrorDictionary[code as SpeechRecognitionError];
      expect(entry).toBeDefined();
      expect(entry.code).toBe(code);
      expect(typeof entry.message).toBe('string');
      expect(entry.message.trim().length).toBeGreaterThan(0);
    }
  });

  it('has the same number of dictionary keys as enum members', () => {
    const dictionaryKeys = numericEnumValues(ErrorDictionary);
    expect(dictionaryKeys).toEqual(codes);
  });

  it('keeps 4.10 code 0..6 contiguous', () => {
    expect(codes).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('maps Android emulator silence (ERROR_SPEECH_TIMEOUT) to RecognitionTaskFailed', () => {
    expect(SpeechRecognitionError.RecognitionTaskFailed).toBe(2);
    expect(ErrorDictionary[SpeechRecognitionError.RecognitionTaskFailed].message).toContain(
      'failed',
    );
  });

  it('onError accepts an optional native trace string (4.10 surface)', () => {
    const traces: Array<string | undefined> = [];
    const onError = (error: SpeechRecognitionError, trace?: string) => {
      expect(ErrorDictionary[error]).toBeDefined();
      traces.push(trace);
    };
    onError(SpeechRecognitionError.Unknown);
    onError(
      SpeechRecognitionError.SessionStartFailed,
      'HybridRecognizer.preparePermissions',
    );
    expect(traces).toEqual([undefined, 'HybridRecognizer.preparePermissions']);
  });
});
