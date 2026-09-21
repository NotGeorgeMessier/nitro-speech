/**
 * Shared helpers for NitroSpeech harness tests.
 *
 * Android emulator contract (Andrei):
 * silence only, then ERROR_SPEECH_TIMEOUT after ~4–5s.
 * Wall-clock from startListening must stay ≤3s before stopListening.
 *
 * iOS simulator contract (Andrei):
 * silence only. Lasting silence must not fail tests.
 * Do not assert "no onError after 5s silence".
 */

import {Platform} from 'react-native';
import {
  SpeechRecognizer,
  SpeechRecognitionError,
  type SpeechRecognitionConfig,
} from 'react-native-nitro-speech';

export interface Deferred<T = void> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

export function deferred<T = void>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {promise, resolve, reject};
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${label} after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Hard cap from startListening on Android emulator. */
export const ANDROID_MAX_LISTEN_MS = 3000;

/** Hold target used by the Android safe-path test (still ≤3s from start). */
export const ANDROID_SAFE_HOLD_MS = 2500;

export function remainingAndroidBudgetMs(startedAt: number): number {
  return ANDROID_MAX_LISTEN_MS - (Date.now() - startedAt);
}

export function assertAndroidListenBudget(startedAt: number): void {
  if (Platform.OS !== 'android') {
    return;
  }
  const elapsed = Date.now() - startedAt;
  if (elapsed > ANDROID_MAX_LISTEN_MS) {
    throw new Error(
      `Android listen exceeded ${ANDROID_MAX_LISTEN_MS}ms wall-clock from startListening (${elapsed}ms)`,
    );
  }
}

export function clearRecognizerCallbacks(): void {
  SpeechRecognizer.onReadyForSpeech = undefined;
  SpeechRecognizer.onRecordingStopped = undefined;
  SpeechRecognizer.onResult = undefined;
  SpeechRecognizer.onError = undefined;
  SpeechRecognizer.onPermissionDenied = undefined;
  SpeechRecognizer.onVolumeChange = undefined;
  SpeechRecognizer.onAutoFinishProgress = undefined;
}

export function isSilenceRelatedError(error: SpeechRecognitionError): boolean {
  return error === SpeechRecognitionError.RecognitionTaskFailed;
}

export function defaultListenConfig(
  overrides: SpeechRecognitionConfig = {},
): SpeechRecognitionConfig {
  return {
    locale: 'en-US',
    autoFinishRecognitionMs: 30_000,
    startHapticFeedbackStyle: 'none',
    stopHapticFeedbackStyle: 'none',
    ...overrides,
  };
}

export function ensureStopped(): void {
  if (SpeechRecognizer.getIsActive()) {
    SpeechRecognizer.stopListening();
  }
}
