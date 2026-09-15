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
  IOS_EXTENDED_LISTENING_DURATION_MS,
} from './test-utils'

/**
 * NitroSpeech - iOS Simulator Specific Tests
 *
 * SIMULATOR CONSTRAINT (from library author Andrei):
 *
 * iOS Simulator speech stack only produces silence. Lasting silence is OK.
 * Tests must NOT fail because of silence.
 *
 * Unlike Android emulator, iOS simulator does NOT throw errors after extended
 * silence periods. Tests can run longer listening sessions.
 *
 * These tests verify extended listening works correctly on iOS simulator.
 */
describe('NitroSpeech - iOS Simulator', () => {
  beforeAll(async (context) => {
    if (Platform.OS !== 'ios') {
      return context.skip('iOS-specific tests: skipping on Android')
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

  it('can listen for extended period (5+ seconds) without errors', async (context) => {
    if (Platform.OS !== 'ios') {
      return context.skip('iOS-specific test')
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
    }

    try {
      SpeechRecognizer.startListening({
        locale: 'en-US',
        autoFinishRecognitionMs: 30000, // Prevent auto-finish
      })

      await withTimeout(readyDeferred.promise, 10_000, 'onReadyForSpeech')

      // iOS can handle extended silence - wait 5+ seconds
      await sleep(IOS_EXTENDED_LISTENING_DURATION_MS)

      SpeechRecognizer.stopListening()

      await withTimeout(stoppedDeferred.promise, 5_000, 'onRecordingStopped')

      // Should not receive any error during extended silence on iOS
      expect(errorReceived).toBeNull()
    } finally {
      if (SpeechRecognizer.getIsActive()) {
        SpeechRecognizer.stopListening()
      }
    }
  })

  it('getSupportedLocalesIOS returns array (iOS only)', async (context) => {
    if (Platform.OS !== 'ios') {
      return context.skip('iOS-specific API')
    }

    const locales = SpeechRecognizer.getSupportedLocalesIOS()

    expect(Array.isArray(locales)).toBe(true)
    // Note: On simulator, this might return an empty array or limited locales
    // We just verify the API doesn't throw and returns the expected type
  })

  it('auto-finish timer fires correctly on iOS', async (context) => {
    if (Platform.OS !== 'ios') {
      return context.skip('iOS-specific test')
    }

    const readyDeferred = deferred()
    const stoppedDeferred = deferred()
    const progressValues: number[] = []

    SpeechRecognizer.onReadyForSpeech = () => {
      readyDeferred.resolve()
    }
    SpeechRecognizer.onAutoFinishProgress = (timeLeftMs) => {
      progressValues.push(timeLeftMs)
    }
    SpeechRecognizer.onRecordingStopped = () => {
      stoppedDeferred.resolve()
    }

    try {
      // Short auto-finish for testing
      SpeechRecognizer.startListening({
        locale: 'en-US',
        autoFinishRecognitionMs: 3000,
        autoFinishProgressIntervalMs: 500,
      })

      await withTimeout(readyDeferred.promise, 10_000, 'onReadyForSpeech')

      // Wait for auto-finish
      await withTimeout(stoppedDeferred.promise, 10_000, 'onRecordingStopped (auto-finish)')

      // Should have received progress callbacks
      expect(progressValues.length).toBeGreaterThan(0)

      // Progress values should decrease over time
      if (progressValues.length >= 2) {
        expect(progressValues[0]).toBeGreaterThan(progressValues[progressValues.length - 1])
      }
    } finally {
      if (SpeechRecognizer.getIsActive()) {
        SpeechRecognizer.stopListening()
      }
    }
  })

  it('updateConfig works during iOS session', async (context) => {
    if (Platform.OS !== 'ios') {
      return context.skip('iOS-specific test')
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
        autoFinishRecognitionMs: 30000,
        autoFinishProgressIntervalMs: 1000,
      })

      await withTimeout(readyDeferred.promise, 10_000, 'onReadyForSpeech')

      // Update config should not throw
      expect(() => {
        SpeechRecognizer.updateConfig({
          autoFinishRecognitionMs: 20000,
          autoFinishProgressIntervalMs: 500,
        })
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

  it('prewarm resolves without error on iOS', async (context) => {
    if (Platform.OS !== 'ios') {
      return context.skip('iOS-specific test')
    }

    // Prewarm should resolve without throwing
    await expect(
      SpeechRecognizer.prewarm({
        locale: 'en-US',
      }),
    ).resolves.not.toThrow()
  })
})
