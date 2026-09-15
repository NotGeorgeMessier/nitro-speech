import { describe, expect, it, beforeAll } from 'react-native-harness'
import {
  SpeechRecognizer,
  PermissionStatus,
} from 'react-native-nitro-speech'

/**
 * NitroSpeech - Permissions Harness Tests
 *
 * Tests permission-related functionality of the speech recognizer.
 * These tests work on both iOS Simulator and Android Emulator since
 * they don't depend on actual speech recognition.
 */
describe('NitroSpeech - Permissions', () => {
  beforeAll(async () => {
    // Harness should grant permissions automatically when permissions: true is set
  })

  it('returns a valid PermissionStatus from getPermissions()', () => {
    const status = SpeechRecognizer.getPermissions()

    // Status should be one of the valid enum values
    expect(status).toBeGreaterThanOrEqual(0)
    expect(status).toBeLessThanOrEqual(2)

    // Verify it's a known status
    const statusName = PermissionStatus[status]
    expect(['GRANTED', 'DENIED', 'NOT_REQUESTED']).toContain(statusName)
  })

  it('has GRANTED permission status after harness grants permissions', () => {
    const status = SpeechRecognizer.getPermissions()

    // With permissions: true in harness config, permissions should be granted
    expect(status).toBe(PermissionStatus.GRANTED)
  })

  it('returns consistent permission status on repeated calls', () => {
    const status1 = SpeechRecognizer.getPermissions()
    const status2 = SpeechRecognizer.getPermissions()
    const status3 = SpeechRecognizer.getPermissions()

    expect(status1).toBe(status2)
    expect(status2).toBe(status3)
  })

  it('PermissionStatus enum has expected values', () => {
    // Verify enum structure matches expected values
    expect(PermissionStatus.GRANTED).toBe(0)
    expect(PermissionStatus.DENIED).toBe(1)
    expect(PermissionStatus.NOT_REQUESTED).toBe(2)
  })
})
