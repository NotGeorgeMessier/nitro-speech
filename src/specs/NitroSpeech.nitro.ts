import type { HybridObject } from 'react-native-nitro-modules'
import type { Recognizer } from './Recognizer.nitro'

export interface NitroSpeech extends HybridObject<{
  ios: 'swift'
  android: 'kotlin'
}> {
  recognizer: Recognizer
}
