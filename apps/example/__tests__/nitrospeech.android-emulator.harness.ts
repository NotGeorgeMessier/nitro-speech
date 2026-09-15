import { Platform } from 'react-native'
import { describe, expect, it, beforeAll, beforeEach } from 'react-native-harness'
import {
  SpeechRecognizer,
  PermissionStatus,
  SpeechRecognitionError,
} from 'react-native-nitro-speech'
import {
  deferred,
  withTimeout,
  sleep,
  ANDROID_SAFE_LISTENING_DURATION_MS,
  ANDROID_SILENCE_ERROR_CODE,
} from './test-utils'

/**
 * NitroSpeech - Android Emulator Specific Tests
 *
 * CRITICAL EMULATOR CONSTRAINT (from library author Andrei):
 *
 * Android Emulator produces only silence. After approximately 4-5 seconds,
 * a specific silence-related error fires from the native SpeechRecognizer:
 *
 * - Native error: SpeechRecognizer.ERROR_SPEECH_TIMEOUT (code 6)
 * - Native message: "No speech input"
 * - Library mapping: SpeechRecognitionError.RecognitionTaskFailed (code 2)
 * - ErrorDictionary message: "Speech Recognition has started but failed"
 *
 * To avoid hitting this error in emulator tests:
 * - startListening → keep ≤3 seconds → stopListening
 * - This flow must NOT hit the silence error and must NOT crash.
 *
 * These tests verify the safe start/stop path works on Android emulators.
 */
describe('NitroSpeech - Android Emulator Safe Path', () => {
  beforeAll(async (context) => {
    if (Platform.OS !== 'android') {
      return context.skip('Android-specific tests: skipping on iOS')
    }

    const status = SpeechRecognizer.getPermissions()
    expect(status).toBe(PermissionStatus.GRANTED)
  })

  beforeEach(() => {
    SpeechRecognizer.onReadyForSpeech = undefined
    SpeechRecognizer.onRecordingStopped = undefined
    SpeechRecognizer.onResult = undefined
    SpeechRecognizer.onError = undefined
    SpeechRecognizer.onPermissionDenied = undefined
    SpeechRecognizer.onVolumeChange = undefined
    SpeechRecognizer.onAutoFinishProgress = undefined
  })

  it('completes start → ≤3s wait → stop without hitting silence error', async (context) => {
    if (Platform.OS !== 'android') {
      return context.skip('Android-specific test')
    }

    const readyDeferred = deferred()
    const stoppedDeferred = deferred()
    let errorReceived: SpeechRecognitionError | null = null

    SpeechRecognizer.onReadyForSpeech = () => {
      readyDeferred.resolve()
    }
    SpeechRecognizer.onRecordingStopped = () => {
      stoppedDeferred.resolve()
    }
    SpeechRecognizer.onError = (error) => {
      errorReceived = error
      // Don't reject - we want to check what error we got
    }

    try {
      SpeechRecognizer.startListening({
        locale: 'en-US',
        autoFinishRecognitionMs: 30000, // Prevent auto-finish
      })

      // Wait for ready
      await withTimeout(readyDeferred.promise, 10_000, 'onReadyForSpeech')

      // Wait for SAFE duration (≤3 seconds)
      // Using 2.5 seconds to stay well under the 4-5 second threshold
      await sleep(ANDROID_SAFE_LISTENING_DURATION_MS)

      // Stop before silence error fires
      SpeechRecognizer.stopListening()

      // Wait for stopped
      await withTimeout(stoppedDeferred.promise, 5_000, 'onRecordingStopped')

      // Verify NO silence error was received
      if (errorReceived !== null) {
        expect(errorReceived).not.toBe(ANDROID_SILENCE_ERROR_CODE)
      }
    } finally {
      if (SpeechRecognizer.getIsActive()) {
        SpeechRecognizer.stopListening()
      }
    }
  })

  it('can perform multiple safe start/stop cycles without errors', async (context) => {
    if (Platform.OS !== 'android') {
      return context.skip('Android-specific test')
    }

    const cycles = 3
    const errors: SpeechRecognitionError[] = []

    for (let i = 0; i < cycles; i++) {
      const readyDeferred = deferred()
      const stoppedDeferred = deferred()

      SpeechRecognizer.onReadyForSpeech = () => {
        readyDeferred.resolve()
      }
      SpeechRecognizer.onRecordingStopped = () => {
        stoppedDeferred.resolve()
      }
      SpeechRecognizer.onError = (error) => {
        errors.push(error)
      }

      try {
        SpeechRecognizer.startListening({
          locale: 'en-US',
          autoFinishRecognitionMs: 30000,
        })

        await withTimeout(readyDeferred.promise, 10_000, `onReadyForSpeech (cycle ${i + 1})`)

        // Stay under 3 seconds
        await sleep(ANDROID_SAFE_LISTENING_DURATION_MS)

        SpeechRecognizer.stopListening()

        await withTimeout(stoppedDeferred.promise, 5_000, `onRecordingStopped (cycle ${i + 1})`)

        // Brief pause between cycles
        await sleep(500)
      } finally {
        if (SpeechRecognizer.getIsActive()) {
          SpeechRecognizer.stopListening()
        }
      }
    }

    // No silence errors should have been received
    const silenceErrors = errors.filter((e) => e === ANDROID_SILENCE_ERROR_CODE)
    expect(silenceErrors).toHaveLength(0)
  })

  it('receives onVolumeChange events during short listening session', async (context) => {
    if (Platform.OS !== 'android') {
      return context.skip('Android-specific test')
    }

    const readyDeferred = deferred()
    const stoppedDeferred = deferred()
    const volumeEvents: number[] = []

    SpeechRecognizer.onReadyForSpeech = () => {
      readyDeferred.resolve()
    }
    SpeechRecognizer.onRecordingStopped = () => {
      stoppedDeferred.resolve()
    }
    SpeechRecognizer.onVolumeChange = (event) => {
      volumeEvents.push(event.rawVolume)
    }

    try {
      SpeechRecognizer.startListening({
        locale: 'en-US',
        autoFinishRecognitionMs: 30000,
      })

      await withTimeout(readyDeferred.promise, 10_000, 'onReadyForSpeech')

      // Listen for safe duration
      await sleep(ANDROID_SAFE_LISTENING_DURATION_MS)

      SpeechRecognizer.stopListening()

      await withTimeout(stoppedDeferred.promise, 5_000, 'onRecordingStopped')

      // Volume events should have been received (even if values are 0 due to silence)
      expect(volumeEvents.length).toBeGreaterThan(0)
    } finally {
      if (SpeechRecognizer.getIsActive()) {
        SpeechRecognizer.stopListening()
      }
    }
  })

  it('resetAutoFinishTime works during short session', async (context) => {
    if (Platform.OS !== 'android') {
      return context.skip('Android-specific test')
    }

    const readyDeferred = deferred()
    const stoppedDeferred = deferred()

    SpeechRecognizer.onReadyForSpeech = () => {
      readyDeferred.resolve()
    }
    SpeechRecognizer.onRecordingStopped = () => {
      stoppedDeferred.resolve()
    }

    try {
      SpeechRecognizer.startListening({
        locale: 'en-US',
        autoFinishRecognitionMs: 10000,
        autoFinishProgressIntervalMs: 500,
      })

      await withTimeout(readyDeferred.promise, 10_000, 'onReadyForSpeech')

      // Reset should not throw
      expect(() => {
        SpeechRecognizer.resetAutoFinishTime()
      }).not.toThrow()

      // Stay under safe duration
      await sleep(1000)

      SpeechRecognizer.stopListening()

      await withTimeout(stoppedDeferred.promise, 5_000, 'onRecordingStopped')
    } finally {
      if (SpeechRecognizer.getIsActive()) {
        SpeechRecognizer.stopListening()
      }
    }
  })

  it('addAutoFinishTime works during short session', async (context) => {
    if (Platform.OS !== 'android') {
      return context.skip('Android-specific test')
    }

    const readyDeferred = deferred()
    const stoppedDeferred = deferred()

    SpeechRecognizer.onReadyForSpeech = () => {
      readyDeferred.resolve()
    }
    SpeechRecognizer.onRecordingStopped = () => {
      stoppedDeferred.resolve()
    }

    try {
      SpeechRecognizer.startListening({
        locale: 'en-US',
        autoFinishRecognitionMs: 5000,
        autoFinishProgressIntervalMs: 500,
      })

      await withTimeout(readyDeferred.promise, 10_000, 'onReadyForSpeech')

      // Adding time should not throw
      expect(() => {
        SpeechRecognizer.addAutoFinishTime(5000)
      }).not.toThrow()

      await sleep(1000)

      SpeechRecognizer.stopListening()

      await withTimeout(stoppedDeferred.promise, 5_000, 'onRecordingStopped')
    } finally {
      if (SpeechRecognizer.getIsActive()) {
        SpeechRecognizer.stopListening()
      }
    }
  })
})
