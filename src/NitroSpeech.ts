import { NitroModules } from 'react-native-nitro-modules'
import type { NitroSpeech as NitroSpeechSpec } from './specs/NitroSpeech.nitro'

export const NitroSpeech =
  NitroModules.createHybridObject<NitroSpeechSpec>('NitroSpeech')
