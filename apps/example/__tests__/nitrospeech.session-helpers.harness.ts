import {Platform} from 'react-native';
import {beforeEach, describe, expect, it} from 'react-native-harness';
import {SpeechRecognizer} from 'react-native-nitro-speech';
import {clearRecognizerCallbacks, ensureStopped} from './test-utils';

/**
 * Cheap session helpers that do not start a listen session.
 * Safe on both Android emulator and iOS simulator.
 */
describe('NitroSpeech - Session helpers', () => {
  beforeEach(() => {
    clearRecognizerCallbacks();
    ensureStopped();
  });

  it('getVoiceInputVolume is numeric when idle', () => {
    const volume = SpeechRecognizer.getVoiceInputVolume();
    expect(typeof volume.smoothedVolume).toBe('number');
    expect(typeof volume.rawVolume).toBe('number');
  });

  it('timer and config helpers are safe when idle', () => {
    expect(() => {
      SpeechRecognizer.resetAutoFinishTime();
      SpeechRecognizer.addAutoFinishTime(500);
      SpeechRecognizer.updateConfig({
        autoFinishRecognitionMs: 12_000,
        autoFinishProgressIntervalMs: 250,
      });
    }).not.toThrow();
    expect(SpeechRecognizer.getIsActive()).toBe(false);
  });

  it('getSupportedLocalesIOS always returns an array', () => {
    const locales = SpeechRecognizer.getSupportedLocalesIOS();
    expect(Array.isArray(locales)).toBe(true);
    if (Platform.OS === 'android') {
      expect(locales).toHaveLength(0);
    }
  });

  it('prewarm resolves without starting a session', async () => {
    await SpeechRecognizer.prewarm(
      {locale: 'en-US'},
      {requestPermission: true},
    );
    expect(SpeechRecognizer.getIsActive()).toBe(false);
  });

  it('onDeviceRecognitionAvailable is a boolean for a common locale', () => {
    expect(typeof SpeechRecognizer.onDeviceRecognitionAvailable('en-US')).toBe(
      'boolean',
    );
    expect(typeof SpeechRecognizer.onDeviceRecognitionAvailable()).toBe(
      'boolean',
    );
  });
});
