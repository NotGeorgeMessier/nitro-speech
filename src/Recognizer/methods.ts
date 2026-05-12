import { SpeechRecognizer } from './SpeechRecognizer'
import type { RecognizerMethods } from './types'

export const recognizerPrewarm: RecognizerMethods['prewarm'] = (
  params,
  options
) => {
  'worklet'
  return SpeechRecognizer.prewarm(params, options)
}

export const recognizerStartListening: RecognizerMethods['startListening'] = (
  params
) => {
  'worklet'
  SpeechRecognizer.startListening(params)
}

export const recognizerStopListening: RecognizerMethods['stopListening'] =
  () => {
    'worklet'
    SpeechRecognizer.stopListening()
  }

export const recognizerResetAutoFinishTime: RecognizerMethods['resetAutoFinishTime'] =
  () => {
    'worklet'
    SpeechRecognizer.resetAutoFinishTime()
  }

export const recognizerAddAutoFinishTime: RecognizerMethods['addAutoFinishTime'] =
  (additionalTimeMs) => {
    'worklet'
    SpeechRecognizer.addAutoFinishTime(additionalTimeMs)
  }

export const recognizerUpdateConfig: RecognizerMethods['updateConfig'] = (
  newConfig,
  resetAutoFinishTime
) => {
  'worklet'
  SpeechRecognizer.updateConfig(newConfig, resetAutoFinishTime)
}

export const recognizerGetIsActive: RecognizerMethods['getIsActive'] = () => {
  'worklet'
  return SpeechRecognizer.getIsActive()
}

export const recognizerGetVoiceInputVolume: RecognizerMethods['getVoiceInputVolume'] =
  () => {
    'worklet'
    return SpeechRecognizer.getVoiceInputVolume()
  }

export const recognizerGetSupportedLocalesIOS: RecognizerMethods['getSupportedLocalesIOS'] =
  () => {
    'worklet'
    return SpeechRecognizer.getSupportedLocalesIOS().sort()
  }
