import {beforeEach, describe, expect, it} from 'react-native-harness';
import {
  SpeechRecognizer,
  PermissionStatus,
  SpeechRecognitionError,
} from 'react-native-nitro-speech';
import {
  ANDROID_MAX_LISTEN_MS,
  ANDROID_SAFE_HOLD_MS,
  assertAndroidListenBudget,
  clearRecognizerCallbacks,
  defaultListenConfig,
  deferred,
  ensureStopped,
  remainingAndroidBudgetMs,
  sleep,
  withTimeout,
} from './test-utils';

/**
 * Android emulator: silence only.
 * Native SpeechRecognizer.ERROR_SPEECH_TIMEOUT (6, "No speech input")
 * maps to SpeechRecognitionError.RecognitionTaskFailed after ~4–5s.
 *
 * Safe flow: startListening → hold ≤3s wall-clock → stopListening.
 */
describe('NitroSpeech - Android emulator safe path', () => {
  beforeEach(() => {
    clearRecognizerCallbacks();
    ensureStopped();
  });

  it('completes start → ≤3s from startListening → stop without silence timeout', async () => {
    expect(SpeechRecognizer.getPermissions()).toBe(PermissionStatus.GRANTED);

    const ready = deferred();
    const stopped = deferred();
    const errors: SpeechRecognitionError[] = [];

    SpeechRecognizer.onReadyForSpeech = () => ready.resolve();
    SpeechRecognizer.onRecordingStopped = () => stopped.resolve();
    SpeechRecognizer.onError = error => {
      errors.push(error);
    };

    const startedAt = Date.now();
    try {
      SpeechRecognizer.startListening(defaultListenConfig());
      await withTimeout(
        ready.promise,
        Math.max(250, remainingAndroidBudgetMs(startedAt)),
        'onReadyForSpeech',
      );

      const holdFor = Math.max(
        0,
        Math.min(
          ANDROID_SAFE_HOLD_MS - (Date.now() - startedAt),
          remainingAndroidBudgetMs(startedAt) - 50,
        ),
      );
      if (holdFor > 0) {
        await sleep(holdFor);
      }

      SpeechRecognizer.stopListening();
      assertAndroidListenBudget(startedAt);
      expect(Date.now() - startedAt).toBeLessThanOrEqual(ANDROID_MAX_LISTEN_MS);

      await withTimeout(stopped.promise, 5_000, 'onRecordingStopped');
      expect(errors).not.toContain(SpeechRecognitionError.RecognitionTaskFailed);
    } finally {
      ensureStopped();
    }
  });

  it('can perform multiple safe start/stop cycles without silence timeout', async () => {
    const errors: SpeechRecognitionError[] = [];

    for (let i = 0; i < 3; i++) {
      const ready = deferred();
      const stopped = deferred();

      SpeechRecognizer.onReadyForSpeech = () => ready.resolve();
      SpeechRecognizer.onRecordingStopped = () => stopped.resolve();
      SpeechRecognizer.onError = error => {
        errors.push(error);
      };

      const startedAt = Date.now();
      try {
        SpeechRecognizer.startListening(defaultListenConfig());
        await withTimeout(
          ready.promise,
          Math.max(250, remainingAndroidBudgetMs(startedAt)),
          `onReadyForSpeech (cycle ${i + 1})`,
        );

        const holdFor = Math.max(
          0,
          Math.min(
            800,
            remainingAndroidBudgetMs(startedAt) - 50,
          ),
        );
        if (holdFor > 0) {
          await sleep(holdFor);
        }

        SpeechRecognizer.stopListening();
        assertAndroidListenBudget(startedAt);
        await withTimeout(
          stopped.promise,
          5_000,
          `onRecordingStopped (cycle ${i + 1})`,
        );
      } finally {
        ensureStopped();
      }
    }

    expect(
      errors.filter(error => error === SpeechRecognitionError.RecognitionTaskFailed),
    ).toHaveLength(0);
  });

  it('resetAutoFinishTime and addAutoFinishTime are safe during a short session', async () => {
    const ready = deferred();
    const stopped = deferred();

    SpeechRecognizer.onReadyForSpeech = () => ready.resolve();
    SpeechRecognizer.onRecordingStopped = () => stopped.resolve();

    const startedAt = Date.now();
    try {
      SpeechRecognizer.startListening(
        defaultListenConfig({
          autoFinishRecognitionMs: 10_000,
          autoFinishProgressIntervalMs: 200,
        }),
      );
      await withTimeout(
        ready.promise,
        Math.max(250, remainingAndroidBudgetMs(startedAt)),
        'onReadyForSpeech',
      );

      expect(() => {
        SpeechRecognizer.resetAutoFinishTime();
        SpeechRecognizer.addAutoFinishTime(1000);
      }).not.toThrow();

      SpeechRecognizer.stopListening();
      assertAndroidListenBudget(startedAt);
      await withTimeout(stopped.promise, 5_000, 'onRecordingStopped');
    } finally {
      ensureStopped();
    }
  });
});
