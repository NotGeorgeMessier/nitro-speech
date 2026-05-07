import type { Recognizer as RecognizerSpec } from '../specs/Recognizer.nitro'
import type { SpeechRecognitionConfig } from '../specs/SpeechRecognitionConfig'
import type { VolumeChangeEvent } from '../specs/VolumeChangeEvent'

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
  | 'startListening'
  | 'stopListening'
  | 'resetAutoFinishTime'
  | 'addAutoFinishTime'
  | 'updateConfig'
  | 'getIsActive'
  | 'getVoiceInputVolume'
  | 'getSupportedLocalesIOS'
>

export type {
  RecognizerSpec,
  SpeechRecognitionConfig,
  VolumeChangeEvent,
  RecognizerCallbacks,
  RecognizerMethods,
}
