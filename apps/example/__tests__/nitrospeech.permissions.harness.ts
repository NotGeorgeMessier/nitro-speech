import {describe, expect, it} from 'react-native-harness';
import {SpeechRecognizer, PermissionStatus} from 'react-native-nitro-speech';

describe('NitroSpeech - Permissions', () => {
  it('returns a valid PermissionStatus from getPermissions()', () => {
    const status = SpeechRecognizer.getPermissions();
    expect(status).toBeGreaterThanOrEqual(0);
    expect(status).toBeLessThanOrEqual(2);
    expect(['GRANTED', 'DENIED', 'NOT_REQUESTED']).toContain(
      PermissionStatus[status],
    );
  });

  it('has GRANTED permission status after harness grants permissions', () => {
    const status = SpeechRecognizer.getPermissions();
    expect(status).toBe(PermissionStatus.GRANTED);
  });

  it('returns consistent permission status on repeated calls', () => {
    const status1 = SpeechRecognizer.getPermissions();
    const status2 = SpeechRecognizer.getPermissions();
    const status3 = SpeechRecognizer.getPermissions();
    expect(status1).toBe(status2);
    expect(status2).toBe(status3);
  });

  it('PermissionStatus enum has expected values', () => {
    expect(PermissionStatus.GRANTED).toBe(0);
    expect(PermissionStatus.DENIED).toBe(1);
    expect(PermissionStatus.NOT_REQUESTED).toBe(2);
  });
});
