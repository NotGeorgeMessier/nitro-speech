import {Platform} from 'react-native';
import {beforeEach, describe, expect, it} from 'react-native-harness';
import {
  SpeechRecognizer,
  PermissionStatus,
  SpeechRecognitionError,
} from 'react-native-nitro-speech';
import {
  assertAndroidListenBudget,
  clearRecognizerCallbacks,
  defaultListenConfig,
  deferred,
  ensureStopped,
  isSilenceRelatedError,
  remainingAndroidBudgetMs,
  withTimeout,
} from './test-utils';

/**
 * Start/stop lifecycle. Not STT accuracy.
 *
 * Android: every listen session stops within 3s of startListening.
 * iOS: silence must not fail the test.
 */
describe('NitroSpeech - Lifecycle', () => {
  beforeEach(() => {
    clearRecognizerCallbacks();
    ensureStopped();
  });

  it('reports isActive as false before starting', () => {
    expect(SpeechRecognizer.getIsActive()).toBe(false);
  });

  it('stopListening is safe to call when not active', () => {
    expect(() => {
      SpeechRecognizer.stopListening();
    }).not.toThrow();
  });

  it('fires onReadyForSpeech then onRecordingStopped', async () => {
    expect(SpeechRecognizer.getPermissions()).toBe(PermissionStatus.GRANTED);

    const ready = deferred();
    const stopped = deferred();
    const errors: SpeechRecognitionError[] = [];

    SpeechRecognizer.onReadyForSpeech = () => ready.resolve();
    SpeechRecognizer.onRecordingStopped = () => stopped.resolve();
    SpeechRecognizer.onError = error => {
      errors.push(error);
      if (Platform.OS === 'ios' && isSilenceRelatedError(error)) {
        return;
      }
      ready.reject(
        new Error(`Unexpected error: ${SpeechRecognitionError[error]}`),
      );
    };

    const startedAt = Date.now();
    try {
      SpeechRecognizer.startListening(defaultListenConfig());
      const readyTimeout =
        Platform.OS === 'android'
          ? Math.max(250, remainingAndroidBudgetMs(startedAt))
          : 10_000;
      await withTimeout(ready.promise, readyTimeout, 'onReadyForSpeech');
      expect(SpeechRecognizer.getIsActive()).toBe(true);

      SpeechRecognizer.stopListening();
      assertAndroidListenBudget(startedAt);
      await withTimeout(stopped.promise, 5_000, 'onRecordingStopped');
      expect(SpeechRecognizer.getIsActive()).toBe(false);
    } finally {
      ensureStopped();
    }
  });

  it('can start and stop multiple times in sequence', async () => {
    for (let i = 0; i < 3; i++) {
      const ready = deferred();
      const stopped = deferred();

      SpeechRecognizer.onReadyForSpeech = () => ready.resolve();
      SpeechRecognizer.onRecordingStopped = () => stopped.resolve();
      SpeechRecognizer.onError = error => {
        if (Platform.OS === 'ios' && isSilenceRelatedError(error)) {
          return;
        }
        ready.reject(
          new Error(
            `Unexpected error on cycle ${i + 1}: ${SpeechRecognitionError[error]}`,
          ),
        );
      };

      const startedAt = Date.now();
      try {
        SpeechRecognizer.startListening(defaultListenConfig());
        const readyTimeout =
          Platform.OS === 'android'
            ? Math.max(250, remainingAndroidBudgetMs(startedAt))
            : 10_000;
        await withTimeout(
          ready.promise,
          readyTimeout,
          `onReadyForSpeech (cycle ${i + 1})`,
        );
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
  });

  it('returns a VolumeChangeEvent from getVoiceInputVolume while listening', async () => {
    const ready = deferred();
    const stopped = deferred();

    SpeechRecognizer.onReadyForSpeech = () => ready.resolve();
    SpeechRecognizer.onRecordingStopped = () => stopped.resolve();
    SpeechRecognizer.onError = error => {
      if (Platform.OS === 'ios' && isSilenceRelatedError(error)) {
        return;
      }
      ready.reject(
        new Error(`Unexpected error: ${SpeechRecognitionError[error]}`),
      );
    };

    const startedAt = Date.now();
    try {
      SpeechRecognizer.startListening(defaultListenConfig());
      const readyTimeout =
        Platform.OS === 'android'
          ? Math.max(250, remainingAndroidBudgetMs(startedAt))
          : 10_000;
      await withTimeout(ready.promise, readyTimeout, 'onReadyForSpeech');

      const volumeEvent = SpeechRecognizer.getVoiceInputVolume();
      expect(volumeEvent).toHaveProperty('smoothedVolume');
      expect(volumeEvent).toHaveProperty('rawVolume');
      expect(typeof volumeEvent.smoothedVolume).toBe('number');
      expect(typeof volumeEvent.rawVolume).toBe('number');

      SpeechRecognizer.stopListening();
      assertAndroidListenBudget(startedAt);
      await withTimeout(stopped.promise, 5_000, 'onRecordingStopped');
    } finally {
      ensureStopped();
    }
  });

  it('fires onAutoFinishProgress while listening', async () => {
    const ready = deferred();
    const progress = deferred<number>();
    const stopped = deferred();

    SpeechRecognizer.onReadyForSpeech = () => ready.resolve();
    SpeechRecognizer.onAutoFinishProgress = timeLeftMs => {
      progress.resolve(timeLeftMs);
    };
    SpeechRecognizer.onRecordingStopped = () => stopped.resolve();
    SpeechRecognizer.onError = error => {
      if (Platform.OS === 'ios' && isSilenceRelatedError(error)) {
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
          autoFinishRecognitionMs: 20_000,
          autoFinishProgressIntervalMs: 200,
        }),
      );
      const readyTimeout =
        Platform.OS === 'android'
          ? Math.max(250, remainingAndroidBudgetMs(startedAt))
          : 10_000;
      await withTimeout(ready.promise, readyTimeout, 'onReadyForSpeech');

      const progressTimeout =
        Platform.OS === 'android'
          ? Math.max(200, remainingAndroidBudgetMs(startedAt) - 50)
          : 5_000;
      const timeLeft = await withTimeout(
        progress.promise,
        progressTimeout,
        'onAutoFinishProgress',
      );
      expect(typeof timeLeft).toBe('number');
      expect(timeLeft).toBeGreaterThan(0);

      SpeechRecognizer.stopListening();
      assertAndroidListenBudget(startedAt);
      await withTimeout(stopped.promise, 5_000, 'onRecordingStopped');
    } finally {
      ensureStopped();
    }
  });
});
