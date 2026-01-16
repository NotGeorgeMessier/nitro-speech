import { NitroModules } from 'react-native-nitro-modules'
import type { NitroSpeech as NitroSpeechSpec } from './specs/NitroSpeech.nitro'

const NitroSpeech =
  NitroModules.createHybridObject<NitroSpeechSpec>('NitroSpeech')

export const Recognizer = NitroSpeech.recognizer
export type { SpeechToTextParams } from './specs/NitroSpeech.nitro'
