import type { Recognizer as RecognizerSpec } from '../specs/Recognizer.nitro'
import type { SpeechToTextParams } from '../specs/SpeechToTextParams'
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
  | 'getSupportedLocalesIOS'
>

export type {
  RecognizerSpec,
  SpeechToTextParams,
  VolumeChangeEvent,
  RecognizerCallbacks,
  RecognizerMethods,
}
