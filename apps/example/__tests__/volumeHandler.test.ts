import {
  speechRecognizerVolumeChangeHandler,
  type VolumeChangeEvent,
} from 'react-native-nitro-speech';

function event(
  overrides: Partial<VolumeChangeEvent> = {},
): VolumeChangeEvent {
  return {
    smoothedVolume: 0.123456,
    rawVolume: 0.987654,
    db: -12.345,
    ...overrides,
  };
}

describe('speechRecognizerVolumeChangeHandler', () => {
  afterEach(() => {
    speechRecognizerVolumeChangeHandler({
      smoothedVolume: 0,
      rawVolume: 0,
      db: undefined,
    });
  });

  it('rounds volumes to 4 decimal places and db to 2', () => {
    const incoming = event({db: -12.36, rawVolume: 0.987654, smoothedVolume: 0.123456});
    speechRecognizerVolumeChangeHandler(incoming);
    expect(incoming.smoothedVolume).toBe(0.1235);
    expect(incoming.rawVolume).toBe(0.9877);
    expect(incoming.db).toBe(-12.36);
  });

  it('clears db when missing', () => {
    const incoming = event({db: undefined, rawVolume: 0.2});
    speechRecognizerVolumeChangeHandler(incoming);
    expect(incoming.db).toBeUndefined();
  });

  it('treats zero raw volume as inactive', () => {
    speechRecognizerVolumeChangeHandler(event({rawVolume: 0.5}));
    const idle = event({rawVolume: 0, smoothedVolume: 0, db: undefined});
    speechRecognizerVolumeChangeHandler(idle);
    expect(idle.rawVolume).toBe(0);
  });
});
