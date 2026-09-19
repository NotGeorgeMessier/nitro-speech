import {Platform} from 'react-native';
import {beforeEach, describe, expect, it} from 'react-native-harness';
import {
  SpeechRecognizer,
  SpeechRecognitionError,
} from 'react-native-nitro-speech';
import {
  assertAndroidListenBudget,
  clearRecognizerCallbacks,
  defaultListenConfig,
  deferred,
  ensureStopped,
  remainingAndroidBudgetMs,
  withTimeout,
} from './test-utils';

/**
 * On-device path coverage. Cheap service/locale checks plus a prefer session.
 * Does not assert transcription quality or that a model is installed.
 */
describe('NitroSpeech - On-device path', () => {
  beforeEach(() => {
    clearRecognizerCallbacks();
    ensureStopped();
  });

  it('onDeviceRecognitionAvailable returns a boolean', () => {
    const available = SpeechRecognizer.onDeviceRecognitionAvailable('en-US');
    expect(typeof available).toBe('boolean');
  });

  it('getSupportedLocales returns locale arrays', async () => {
    const supported = await SpeechRecognizer.getSupportedLocales();
    expect(supported).toBeDefined();
    expect(Array.isArray(supported.locales)).toBe(true);
    expect(Array.isArray(supported.installedLocales)).toBe(true);
  });

  it('startListening with onDevice prefer does not crash', async () => {
    const ready = deferred();
    const stopped = deferred();

    SpeechRecognizer.onReadyForSpeech = () => ready.resolve();
    SpeechRecognizer.onRecordingStopped = () => stopped.resolve();
    SpeechRecognizer.onError = error => {
      if (
        error === SpeechRecognitionError.OnDeviceNotSupported ||
        error === SpeechRecognitionError.OnDeviceModelNotInstalled ||
        (Platform.OS === 'ios' &&
          error === SpeechRecognitionError.RecognitionTaskFailed)
      ) {
        return;
      }
      ready.reject(
        new Error(`Unexpected error: ${SpeechRecognitionError[error]}`),
      );
    };

    const startedAt = Date.now();
    try {
      SpeechRecognizer.startListening(
        defaultListenConfig({
          onDevice: 'prefer',
        }),
      );

      const readyTimeout =
        Platform.OS === 'android'
          ? Math.max(250, remainingAndroidBudgetMs(startedAt))
          : 10_000;

      await withTimeout(ready.promise, readyTimeout, 'onReadyForSpeech').catch(
        () => undefined,
      );

      if (SpeechRecognizer.getIsActive()) {
        SpeechRecognizer.stopListening();
        if (Platform.OS === 'android') {
          assertAndroidListenBudget(startedAt);
        }
        await withTimeout(stopped.promise, 5_000, 'onRecordingStopped').catch(
          () => {},
        );
      }
    } finally {
      ensureStopped();
    }
  });
});
