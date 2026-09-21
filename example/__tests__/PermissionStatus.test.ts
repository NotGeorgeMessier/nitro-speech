/**
 * Pure JS unit tests for PermissionStatus.
 */

import {PermissionStatus} from 'react-native-nitro-speech';

describe('PermissionStatus enum', () => {
  it('has expected numeric values', () => {
    expect(PermissionStatus.GRANTED).toBe(0);
    expect(PermissionStatus.DENIED).toBe(1);
    expect(PermissionStatus.NOT_REQUESTED).toBe(2);
  });

  it('can reverse lookup from number to name', () => {
    expect(PermissionStatus[0]).toBe('GRANTED');
    expect(PermissionStatus[1]).toBe('DENIED');
    expect(PermissionStatus[2]).toBe('NOT_REQUESTED');
  });

  it('has exactly 3 status values', () => {
    const numericKeys = Object.keys(PermissionStatus).filter(
      key => !Number.isNaN(Number(key)),
    );
    expect(numericKeys).toHaveLength(3);
  });
});
