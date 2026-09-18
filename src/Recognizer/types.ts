import type { Recognizer as RecognizerSpec } from '../specs/Recognizer.nitro'
import type {
  MutableSpeechRecognitionConfig,
  SpeechRecognitionConfig,
} from '../specs/SpeechRecognitionConfig'
import type { VolumeChangeEvent } from '../specs/VolumeChangeEvent'
import type { SpeechRecognitionPrewarm } from '../specs/SpeechRecognitionPrewarm'
import type { UseVoiceInputVolumeConfig } from './useVoiceInputVolume'
import type { SupportedLocales } from '../specs/SupportedLocales'
export { PermissionStatus } from '../specs/Permissions'
export { SpeechRecognitionError } from '../specs/Errors'

type RecognizerCallbacks = Pick<
  RecognizerSpec,
  | 'onReadyForSpeech'
  | 'onRecordingStopped'
  | 'onResult'
  | 'onAutoFinishProgress'
  | 'onError'
  | 'onPermissionDenied'
  | 'onVolumeChange'
>

type RecognizerMethods = Pick<
  RecognizerSpec,
  | 'prewarm'
  | 'startListening'
  | 'stopListening'
  | 'resetAutoFinishTime'
  | 'addAutoFinishTime'
  | 'updateConfig'
  | 'getIsActive'
  | 'getVoiceInputVolume'
  | 'getPermissions'
  | 'getSupportedLocales'
  | 'getSupportedLocalesIOS'
  | 'onDeviceRecognitionAvailable'
>

export type {
  RecognizerSpec,
  SpeechRecognitionConfig,
  SpeechRecognitionPrewarm,
  MutableSpeechRecognitionConfig,
  VolumeChangeEvent,
  SupportedLocales,
  RecognizerCallbacks,
  RecognizerMethods,
  UseVoiceInputVolumeConfig,
}
