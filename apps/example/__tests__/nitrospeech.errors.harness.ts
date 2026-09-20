import {Platform} from 'react-native';
import {beforeEach, describe, expect, it} from 'react-native-harness';
import {
  SpeechRecognizer,
  ErrorDictionary,
  SpeechRecognitionError,
} from 'react-native-nitro-speech';
import {
  ANDROID_MAX_LISTEN_MS,
  assertAndroidListenBudget,
  clearRecognizerCallbacks,
  defaultListenConfig,
  deferred,
  ensureStopped,
  remainingAndroidBudgetMs,
  withTimeout,
} from './test-utils';

describe('NitroSpeech - Error handling', () => {
  beforeEach(() => {
    clearRecognizerCallbacks();
    ensureStopped();
  });

  it('ErrorDictionary contains every SpeechRecognitionError code', () => {
    const expected = [
      SpeechRecognitionError.Unknown,
      SpeechRecognitionError.LocaleNotSupported,
      SpeechRecognitionError.RecognitionTaskFailed,
      SpeechRecognitionError.IosSpeechPermissionNotDetermined,
      SpeechRecognitionError.SessionStartFailed,
      SpeechRecognitionError.OnDeviceNotSupported,
      SpeechRecognitionError.OnDeviceModelNotInstalled,
    ];

    for (const errorCode of expected) {
      const entry = ErrorDictionary[errorCode];
      expect(entry).toBeDefined();
      expect(entry.code).toBe(errorCode);
      expect(typeof entry.message).toBe('string');
      expect(entry.message.length).toBeGreaterThan(0);
    }
  });

  it('ErrorDictionary messages match the documented copy', () => {
    expect(ErrorDictionary[SpeechRecognitionError.Unknown].message).toBe(
      'Unknown error',
    );
    expect(
      ErrorDictionary[SpeechRecognitionError.LocaleNotSupported].message,
    ).toBe('Locale is not supported');
    expect(
      ErrorDictionary[SpeechRecognitionError.RecognitionTaskFailed].message,
    ).toBe('Speech Recognition has started but failed');
    expect(
      ErrorDictionary[SpeechRecognitionError.SessionStartFailed].message,
    ).toBe('Speech Recognition failed to start');
    expect(
      ErrorDictionary[SpeechRecognitionError.OnDeviceNotSupported].message,
    ).toBe('On-device speech recognition is not supported on this device');
    expect(
      ErrorDictionary[SpeechRecognitionError.OnDeviceModelNotInstalled]
        .message,
    ).toBe(
      'On-device speech recognition model is not installed for this locale',
    );
  });

  it('SpeechRecognitionError enum has expected numeric values', () => {
    expect(SpeechRecognitionError.Unknown).toBe(0);
    expect(SpeechRecognitionError.LocaleNotSupported).toBe(1);
    expect(SpeechRecognitionError.RecognitionTaskFailed).toBe(2);
    expect(SpeechRecognitionError.IosSpeechPermissionNotDetermined).toBe(3);
    expect(SpeechRecognitionError.SessionStartFailed).toBe(4);
    expect(SpeechRecognitionError.OnDeviceNotSupported).toBe(5);
    expect(SpeechRecognitionError.OnDeviceModelNotInstalled).toBe(6);
  });

  it('onError receives LocaleNotSupported for an invalid locale', async () => {
    const errorDeferred = deferred<{
      error: SpeechRecognitionError;
      trace?: string;
    }>();
    const stopped = deferred();

    SpeechRecognizer.onError = (error, trace) => {
      errorDeferred.resolve({error, trace});
    };
    SpeechRecognizer.onRecordingStopped = () => stopped.resolve();

    const startedAt = Date.now();
    try {
      SpeechRecognizer.startListening(
        defaultListenConfig({
          locale: 'xx-INVALID-LOCALE-XX',
        }),
      );

      const timeout =
        Platform.OS === 'android'
          ? Math.max(500, remainingAndroidBudgetMs(startedAt) + 2_000)
          : 10_000;
      const received = await withTimeout(
        errorDeferred.promise,
        timeout,
        'onError',
      );
      expect(received.error).toBe(SpeechRecognitionError.LocaleNotSupported);
      expect(ErrorDictionary[received.error].code).toBe(
        SpeechRecognitionError.LocaleNotSupported,
      );
      if (received.trace !== undefined) {
        expect(typeof received.trace).toBe('string');
        expect(received.trace.length).toBeGreaterThan(0);
      }
    } finally {
      if (SpeechRecognizer.getIsActive()) {
        SpeechRecognizer.stopListening();
        if (Platform.OS === 'android') {
          assertAndroidListenBudget(startedAt);
        }
        await withTimeout(stopped.promise, 5_000, 'onRecordingStopped').catch(
          () => {},
        );
      }
    }
  });

  it('documents RecognitionTaskFailed as the Android silence mapping', () => {
    expect(SpeechRecognitionError.RecognitionTaskFailed).toBe(2);
    expect(ANDROID_MAX_LISTEN_MS).toBe(3000);
  });
});
