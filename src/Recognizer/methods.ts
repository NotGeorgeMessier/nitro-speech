import { SpeechRecognizer } from './SpeechRecognizer'
import type { SpeechRecognitionConfig } from './types'

export const recognizerStartListening = (params: SpeechRecognitionConfig) => {
  'worklet'
  SpeechRecognizer.startListening(params)
}

export const recognizerStopListening = () => {
  'worklet'
  SpeechRecognizer.stopListening()
}

export const recognizerResetAutoFinishTime = () => {
  'worklet'
  SpeechRecognizer.resetAutoFinishTime()
}

export const recognizerAddAutoFinishTime = (additionalTimeMs?: number) => {
  'worklet'
  SpeechRecognizer.addAutoFinishTime(additionalTimeMs)
}

export const recognizerUpdateConfig = (
  newConfig: SpeechRecognitionConfig,
  resetAutoFinishTime?: boolean
) => {
  'worklet'
  SpeechRecognizer.updateConfig(newConfig, resetAutoFinishTime)
}

export const recognizerGetIsActive = () => {
  'worklet'
  return SpeechRecognizer.getIsActive()
}

export const recognizerGetSupportedLocalesIOS = () => {
  'worklet'
  return SpeechRecognizer.getSupportedLocalesIOS().sort()
}
