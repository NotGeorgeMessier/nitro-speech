/**
 * Test utilities for NitroSpeech Harness tests.
 */

export interface Deferred<T = void> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (error: unknown) => void
}

/**
 * Creates a deferred promise that can be resolved/rejected externally.
 */
export function deferred<T = void>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/**
 * Wraps a promise with a timeout.
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @param label Label for the timeout error message
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${label} after ${timeoutMs}ms`))
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutId!)
    return result
  } catch (error) {
    clearTimeout(timeoutId!)
    throw error
  }
}

/**
 * Sleep for a specified duration.
 * @param ms Duration in milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Wait until a condition is met or timeout.
 * @param condition Function that returns true when condition is met
 * @param options Configuration options
 */
export async function waitUntil(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number; label?: string } = {},
): Promise<void> {
  const { timeout = 10_000, interval = 100, label = 'condition' } = options
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    const result = await condition()
    if (result) {
      return
    }
    await sleep(interval)
  }

  throw new Error(`Timeout waiting for ${label} after ${timeout}ms`)
}

/**
 * Android emulator silence timeout in milliseconds.
 * After ~4-5 seconds of silence, ERROR_SPEECH_TIMEOUT fires.
 * Use ≤3 seconds for safe start/stop cycles.
 */
export const ANDROID_SAFE_LISTENING_DURATION_MS = 2500

/**
 * iOS simulator can handle longer silence periods without errors.
 */
export const IOS_EXTENDED_LISTENING_DURATION_MS = 5000

/**
 * The Android silence error code from SpeechRecognizer.ERROR_SPEECH_TIMEOUT.
 * This maps to SpeechRecognitionError.RecognitionTaskFailed in the library.
 *
 * Native Android code: SpeechRecognizer.ERROR_SPEECH_TIMEOUT = 6
 * Library mapping: "No speech input" → SpeechRecognitionError.RECOGNITIONTASKFAILED
 */
export const ANDROID_SILENCE_ERROR_CODE = 2 // SpeechRecognitionError.RecognitionTaskFailed
