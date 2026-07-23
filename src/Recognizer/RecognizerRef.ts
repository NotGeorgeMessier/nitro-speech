import type { RecognizerMethods } from './types'
import {
  recognizerAddAutoFinishTime,
  recognizerGetSupportedLocales,
  recognizerGetSupportedLocalesIOS,
  recognizerGetIsActive,
  recognizerResetAutoFinishTime,
  recognizerStartListening,
  recognizerStopListening,
  recognizerUpdateConfig,
  recognizerGetVoiceInputVolume,
  recognizerPrewarm,
  recognizerGetPermissions,
  recognizerOnDeviceRecognitionAvailable,
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
  getPermissions: recognizerGetPermissions,
  getSupportedLocales: recognizerGetSupportedLocales,
  getSupportedLocalesIOS: recognizerGetSupportedLocalesIOS,
  onDeviceRecognitionAvailable: recognizerOnDeviceRecognitionAvailable,
}
