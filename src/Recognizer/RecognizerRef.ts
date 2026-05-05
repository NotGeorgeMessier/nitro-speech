import type { RecognizerMethods } from './types'
import {
  recognizerAddAutoFinishTime,
  recognizerGetSupportedLocalesIOS,
  recognizerGetIsActive,
  recognizerResetAutoFinishTime,
  recognizerStartListening,
  recognizerStopListening,
  recognizerUpdateConfig,
} from './methods'

/**
 * Safe cross-component reference to the Speech Recognizer methods.
 */
export const RecognizerRef: RecognizerMethods = {
  startListening: recognizerStartListening,
  stopListening: recognizerStopListening,
  resetAutoFinishTime: recognizerResetAutoFinishTime,
  addAutoFinishTime: recognizerAddAutoFinishTime,
  updateConfig: recognizerUpdateConfig,
  getIsActive: recognizerGetIsActive,
  getSupportedLocalesIOS: recognizerGetSupportedLocalesIOS,
}
