/**
 * P0 Unit Tests for PermissionStatus enum
 *
 * These tests run without a device/emulator using standard Jest.
 */

import { PermissionStatus } from 'react-native-nitro-speech'

describe('PermissionStatus enum', () => {
  it('exports PermissionStatus enum', () => {
    expect(PermissionStatus).toBeDefined()
  })

  it('has expected numeric values', () => {
    expect(PermissionStatus.GRANTED).toBe(0)
    expect(PermissionStatus.DENIED).toBe(1)
    expect(PermissionStatus.NOT_REQUESTED).toBe(2)
  })

  it('can reverse lookup from number to name', () => {
    expect(PermissionStatus[0]).toBe('GRANTED')
    expect(PermissionStatus[1]).toBe('DENIED')
    expect(PermissionStatus[2]).toBe('NOT_REQUESTED')
  })

  it('has exactly 3 status values', () => {
    const numericKeys = Object.keys(PermissionStatus).filter(
      (key) => !isNaN(Number(key))
    )
    expect(numericKeys).toHaveLength(3)
  })

  it('values are sequential starting from 0', () => {
    const values = [
      PermissionStatus.GRANTED,
      PermissionStatus.DENIED,
      PermissionStatus.NOT_REQUESTED,
    ]

    values.forEach((value, index) => {
      expect(value).toBe(index)
    })
  })
})
