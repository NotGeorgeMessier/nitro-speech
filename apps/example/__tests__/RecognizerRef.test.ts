import {
  PermissionStatus,
  RecognizerRef,
  SpeechRecognizer,
} from 'react-native-nitro-speech';

describe('RecognizerRef method mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes the public recognizer method surface', () => {
    expect(Object.keys(RecognizerRef).sort()).toEqual(
      [
        'addAutoFinishTime',
        'getIsActive',
        'getPermissions',
        'getSupportedLocales',
        'getSupportedLocalesIOS',
        'getVoiceInputVolume',
        'onDeviceRecognitionAvailable',
        'prewarm',
        'resetAutoFinishTime',
        'startListening',
        'stopListening',
        'updateConfig',
      ].sort(),
    );
  });

  it('delegates start/stop/timer/config calls', () => {
    const config = {locale: 'en-US', autoFinishRecognitionMs: 8000};
    RecognizerRef.startListening(config);
    expect(jest.mocked(SpeechRecognizer.startListening)).toHaveBeenCalledWith(config);

    RecognizerRef.stopListening();
    expect(jest.mocked(SpeechRecognizer.stopListening)).toHaveBeenCalled();

    RecognizerRef.resetAutoFinishTime();
    expect(jest.mocked(SpeechRecognizer.resetAutoFinishTime)).toHaveBeenCalled();

    RecognizerRef.addAutoFinishTime(1500);
    expect(jest.mocked(SpeechRecognizer.addAutoFinishTime)).toHaveBeenCalledWith(1500);

    const next = {autoFinishRecognitionMs: 12000};
    RecognizerRef.updateConfig(next, true);
    expect(jest.mocked(SpeechRecognizer.updateConfig)).toHaveBeenCalledWith(next, true);
  });

  it('delegates query helpers through the mock hybrid object', () => {
    expect(RecognizerRef.getIsActive()).toBe(false);
    expect(RecognizerRef.getPermissions()).toBe(PermissionStatus.NOT_REQUESTED);
    expect(RecognizerRef.getVoiceInputVolume()).toEqual({
      smoothedVolume: 0,
      rawVolume: 0,
      db: undefined,
    });
    expect(RecognizerRef.onDeviceRecognitionAvailable('en-US')).toBe(false);
    expect(RecognizerRef.getSupportedLocalesIOS()).toEqual([]);
  });

  it('delegates prewarm and getSupportedLocales promises', async () => {
    await expect(RecognizerRef.prewarm({locale: 'en-US'}, {requestPermission: true})).resolves.toBeUndefined();
    await expect(RecognizerRef.getSupportedLocales()).resolves.toEqual({
      locales: [],
      installedLocales: [],
    });
  });
});
