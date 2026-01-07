import { NitroModules } from 'react-native-nitro-modules'
import type { NitroSpeech as NitroSpeechSpec } from './specs/NitroSpeech.nitro'

const NitroSpeech =
  NitroModules.createHybridObject<NitroSpeechSpec>('NitroSpeech')

export const Recognizer = NitroSpeech.recognizer
export const TTS = NitroSpeech.tts
export type { SpeechToTextParams, TTSParams } from './specs/NitroSpeech.nitro'
