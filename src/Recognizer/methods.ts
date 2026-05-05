import { SpeechRecognizer } from './SpeechRecognizer'
import type { SpeechToTextParams } from './types'

export const recognizerStartListening = (params: SpeechToTextParams) => {
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
  newConfig: SpeechToTextParams,
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
