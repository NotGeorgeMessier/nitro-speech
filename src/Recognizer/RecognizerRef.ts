import type { RecognizerMethods } from './types'
import {
  recognizerAddAutoFinishTime,
  recognizerGetSupportedLocalesIOS,
  recognizerGetIsActive,
  recognizerResetAutoFinishTime,
  recognizerStartListening,
  recognizerStopListening,
  recognizerUpdateConfig,
  recognizerGetVoiceInputVolume,
  recognizerPrewarm,
} from './methods'

/**
 * Safe cross-component reference to the Speech Recognizer methods.
 *
 * All methods support worklets and UI thread calls
 */
export const RecognizerRef: RecognizerMethods = {
  prewarm: recognizerPrewarm,
  startListening: recognizerStartListening,
  stopListening: recognizerStopListening,
  resetAutoFinishTime: recognizerResetAutoFinishTime,
  addAutoFinishTime: recognizerAddAutoFinishTime,
  updateConfig: recognizerUpdateConfig,
  getIsActive: recognizerGetIsActive,
  getVoiceInputVolume: recognizerGetVoiceInputVolume,
  getSupportedLocalesIOS: recognizerGetSupportedLocalesIOS,
}
