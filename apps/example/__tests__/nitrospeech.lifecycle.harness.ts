import { Platform } from 'react-native'
import { describe, expect, it, beforeAll, beforeEach, fn } from 'react-native-harness'
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
  IOS_EXTENDED_LISTENING_DURATION_MS,
} from './test-utils'

/**
 * NitroSpeech - Lifecycle Harness Tests
 *
 * Tests the start/stop lifecycle of the speech recognizer.
 *
 * EMULATOR CONSTRAINTS:
 * - iOS Simulator: Speech stack produces silence only. Tests must not fail due to silence.
 * - Android Emulator: ERROR_SPEECH_TIMEOUT fires after ~4-5 seconds of silence.
 *   Tests use ≤3 second listening windows to avoid hitting this error.
 *
 * These tests verify lifecycle events fire correctly, NOT transcription accuracy.
 */
describe('NitroSpeech - Lifecycle', () => {
  beforeAll(async () => {
    // Verify permissions are granted before running lifecycle tests
    const status = SpeechRecognizer.getPermissions()
    expect(status).toBe(PermissionStatus.GRANTED)
  })

  beforeEach(() => {
    // Clear any previous callbacks
    SpeechRecognizer.onReadyForSpeech = undefined
    SpeechRecognizer.onRecordingStopped = undefined
    SpeechRecognizer.onResult = undefined
    SpeechRecognizer.onError = undefined
    SpeechRecognizer.onPermissionDenied = undefined
    SpeechRecognizer.onVolumeChange = undefined
    SpeechRecognizer.onAutoFinishProgress = undefined
  })

  it('reports isActive as false before starting', () => {
    const isActive = SpeechRecognizer.getIsActive()
    expect(isActive).toBe(false)
  })

  it('fires onReadyForSpeech after startListening', async () => {
    const readyDeferred = deferred()
    const stoppedDeferred = deferred()

    SpeechRecognizer.onReadyForSpeech = () => {
      readyDeferred.resolve()
    }
    SpeechRecognizer.onRecordingStopped = () => {
      stoppedDeferred.resolve()
    }
    SpeechRecognizer.onError = (error) => {
      readyDeferred.reject(new Error(`Unexpected error: ${SpeechRecognitionError[error]}`))
    }

    try {
      SpeechRecognizer.startListening({
        locale: 'en-US',
        autoFinishRecognitionMs: 30000, // Long timeout to prevent auto-finish during test
      })

      // Wait for ready event
      await withTimeout(readyDeferred.promise, 10_000, 'onReadyForSpeech')

      // Stop immediately after ready
      SpeechRecognizer.stopListening()

      // Wait for stopped event
      await withTimeout(stoppedDeferred.promise, 5_000, 'onRecordingStopped')
    } finally {
      // Ensure stopped
      if (SpeechRecognizer.getIsActive()) {
        SpeechRecognizer.stopListening()
      }
    }
  })

  it('fires onRecordingStopped after stopListening', async () => {
    const readyDeferred = deferred()
    const stoppedDeferred = deferred()

    const onStopped = fn(() => {
      stoppedDeferred.resolve()
    })

    SpeechRecognizer.onReadyForSpeech = () => {
      readyDeferred.resolve()
    }
    SpeechRecognizer.onRecordingStopped = onStopped
    SpeechRecognizer.onError = (error) => {
      readyDeferred.reject(new Error(`Unexpected error: ${SpeechRecognitionError[error]}`))
    }

    try {
      SpeechRecognizer.startListening({
        locale: 'en-US',
        autoFinishRecognitionMs: 30000,
      })

      await withTimeout(readyDeferred.promise, 10_000, 'onReadyForSpeech')

      SpeechRecognizer.stopListening()

      await withTimeout(stoppedDeferred.promise, 5_000, 'onRecordingStopped')

      expect(onStopped).toHaveBeenCalledTimes(1)
    } finally {
      if (SpeechRecognizer.getIsActive()) {
        SpeechRecognizer.stopListening()
      }
    }
  })

  it('reports isActive as true while listening', async () => {
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
      })

      await withTimeout(readyDeferred.promise, 10_000, 'onReadyForSpeech')

      // Check isActive while listening
      const isActiveWhileListening = SpeechRecognizer.getIsActive()
      expect(isActiveWhileListening).toBe(true)

      SpeechRecognizer.stopListening()

      await withTimeout(stoppedDeferred.promise, 5_000, 'onRecordingStopped')

      // Check isActive after stopping
      // Note: There may be a small delay before isActive updates
      await sleep(300)
      const isActiveAfterStopping = SpeechRecognizer.getIsActive()
      expect(isActiveAfterStopping).toBe(false)
    } finally {
      if (SpeechRecognizer.getIsActive()) {
        SpeechRecognizer.stopListening()
      }
    }
  })

  it('can start and stop multiple times in sequence', async () => {
    const cycles = 3

    for (let i = 0; i < cycles; i++) {
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
        })

        await withTimeout(readyDeferred.promise, 10_000, `onReadyForSpeech (cycle ${i + 1})`)
        SpeechRecognizer.stopListening()
        await withTimeout(stoppedDeferred.promise, 5_000, `onRecordingStopped (cycle ${i + 1})`)

        // Small delay between cycles
        await sleep(500)
      } finally {
        if (SpeechRecognizer.getIsActive()) {
          SpeechRecognizer.stopListening()
        }
      }
    }
  })

  it('stopListening is safe to call when not active', () => {
    // Should not throw when called while not listening
    expect(() => {
      SpeechRecognizer.stopListening()
    }).not.toThrow()
  })

  it('returns valid VolumeChangeEvent from getVoiceInputVolume', async () => {
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
      })

      await withTimeout(readyDeferred.promise, 10_000, 'onReadyForSpeech')

      const volumeEvent = SpeechRecognizer.getVoiceInputVolume()

      // Verify the volume event structure
      expect(volumeEvent).toHaveProperty('smoothedVolume')
      expect(volumeEvent).toHaveProperty('rawVolume')
      expect(typeof volumeEvent.smoothedVolume).toBe('number')
      expect(typeof volumeEvent.rawVolume).toBe('number')

      SpeechRecognizer.stopListening()
      await withTimeout(stoppedDeferred.promise, 5_000, 'onRecordingStopped')
    } finally {
      if (SpeechRecognizer.getIsActive()) {
        SpeechRecognizer.stopListening()
      }
    }
  })

  it('fires onAutoFinishProgress while listening', async () => {
    const readyDeferred = deferred()
    const progressDeferred = deferred<number>()
    const stoppedDeferred = deferred()

    SpeechRecognizer.onReadyForSpeech = () => {
      readyDeferred.resolve()
    }
    SpeechRecognizer.onAutoFinishProgress = (timeLeftMs) => {
      progressDeferred.resolve(timeLeftMs)
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

      // Wait for at least one progress callback
      const timeLeft = await withTimeout(progressDeferred.promise, 5_000, 'onAutoFinishProgress')

      expect(typeof timeLeft).toBe('number')
      expect(timeLeft).toBeGreaterThan(0)

      SpeechRecognizer.stopListening()
      await withTimeout(stoppedDeferred.promise, 5_000, 'onRecordingStopped')
    } finally {
      if (SpeechRecognizer.getIsActive()) {
        SpeechRecognizer.stopListening()
      }
    }
  })
})
