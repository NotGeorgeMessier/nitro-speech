import { NitroModules } from 'react-native-nitro-modules'
import type { NitroSpeech as NitroSpeechSpec } from './specs/Example.nitro'

export const NitroSpeech =
  NitroModules.createHybridObject<NitroSpeechSpec>('NitroSpeech')
