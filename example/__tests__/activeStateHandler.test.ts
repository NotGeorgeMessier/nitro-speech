import {speechRecognizerActiveStateHandler} from 'react-native-nitro-speech';

describe('speechRecognizerActiveStateHandler', () => {
  afterEach(() => {
    speechRecognizerActiveStateHandler(false);
  });

  it('is a function that accepts a boolean', () => {
    expect(typeof speechRecognizerActiveStateHandler).toBe('function');
    expect(() => {
      speechRecognizerActiveStateHandler(true);
      speechRecognizerActiveStateHandler(true);
      speechRecognizerActiveStateHandler(false);
    }).not.toThrow();
  });
});
