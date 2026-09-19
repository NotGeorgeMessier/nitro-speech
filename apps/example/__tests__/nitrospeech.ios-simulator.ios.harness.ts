import {beforeEach, describe, expect, it} from 'react-native-harness';
import {
  SpeechRecognizer,
  PermissionStatus,
  SpeechRecognitionError,
} from 'react-native-nitro-speech';
import {
  clearRecognizerCallbacks,
  defaultListenConfig,
  deferred,
  ensureStopped,
  isSilenceRelatedError,
  sleep,
  withTimeout,
} from './test-utils';

/**
 * iOS Simulator: speech stack produces silence only.
 * Lasting silence must not fail tests.
 * Do not assert "no onError after 5s of silence".
 */
describe('NitroSpeech - iOS simulator', () => {
  beforeEach(() => {
    clearRecognizerCallbacks();
    ensureStopped();
  });

  it('can listen through extended silence without failing the test', async () => {
    expect(SpeechRecognizer.getPermissions()).toBe(PermissionStatus.GRANTED);

    const ready = deferred();
    const stopped = deferred();

    SpeechRecognizer.onReadyForSpeech = () => ready.resolve();
    SpeechRecognizer.onRecordingStopped = () => stopped.resolve();
    SpeechRecognizer.onError = error => {
      // Silence-related errors must not fail this test.
      if (isSilenceRelatedError(error)) {
        return;
      }
      ready.reject(
        new Error(`Unexpected error: ${SpeechRecognitionError[error]}`),
      );
    };

    try {
      SpeechRecognizer.startListening(defaultListenConfig());
      await withTimeout(ready.promise, 10_000, 'onReadyForSpeech');

      await sleep(5000);

      if (SpeechRecognizer.getIsActive()) {
        SpeechRecognizer.stopListening();
        await withTimeout(stopped.promise, 5_000, 'onRecordingStopped');
      }
    } finally {
      ensureStopped();
    }
  });

  it('getSupportedLocalesIOS returns an array', () => {
    const locales = SpeechRecognizer.getSupportedLocalesIOS();
    expect(Array.isArray(locales)).toBe(true);
  });

  it('updateConfig works during an iOS session', async () => {
    const ready = deferred();
    const stopped = deferred();

    SpeechRecognizer.onReadyForSpeech = () => ready.resolve();
    SpeechRecognizer.onRecordingStopped = () => stopped.resolve();
    SpeechRecognizer.onError = error => {
      if (isSilenceRelatedError(error)) {
        return;
      }
      ready.reject(
        new Error(`Unexpected error: ${SpeechRecognitionError[error]}`),
      );
    };

    try {
      SpeechRecognizer.startListening(defaultListenConfig());
      await withTimeout(ready.promise, 10_000, 'onReadyForSpeech');

      expect(() => {
        SpeechRecognizer.updateConfig({
          autoFinishRecognitionMs: 20_000,
          autoFinishProgressIntervalMs: 500,
        });
      }).not.toThrow();

      SpeechRecognizer.stopListening();
      await withTimeout(stopped.promise, 5_000, 'onRecordingStopped');
    } finally {
      ensureStopped();
    }
  });

  it('prewarm resolves on iOS', async () => {
    await SpeechRecognizer.prewarm(
      {locale: 'en-US'},
      {requestPermission: true},
    );
  });
});
