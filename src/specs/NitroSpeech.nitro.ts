import { type HybridObject } from 'react-native-nitro-modules'

export interface Equalizer extends HybridObject<{
  ios: 'swift'
  android: 'kotlin'
}> {
  setRandom(): void
}

export interface NitroSpeech extends HybridObject<{
  ios: 'swift'
  android: 'kotlin'
}> {
  equalizer: Equalizer
}
