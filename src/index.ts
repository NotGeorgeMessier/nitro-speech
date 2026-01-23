import React from 'react'
import { NitroModules } from 'react-native-nitro-modules'
import type {
  NitroSpeech as NitroSpeechSpec,
  Recognizer as RecognizerSpec,
  SpeechToTextParams,
} from './specs/NitroSpeech.nitro'

const NitroSpeech =
  NitroModules.createHybridObject<NitroSpeechSpec>('NitroSpeech')

/**
 * Unsafe access to the recognizer object for the NitroSpeech module.
 */
export const Recognizer = NitroSpeech.recognizer

type RecognizerCallbacks = Pick<
  RecognizerSpec,
  | 'onReadyForSpeech'
  | 'onRecordingStopped'
  | 'onResult'
  | 'onAutoFinishProgress'
  | 'onError'
  | 'onPermissionDenied'
>

type RecognizerHandlers = Pick<
  RecognizerSpec,
  'startListening' | 'stopListening'
>

const recognizerStartListening = (params: SpeechToTextParams) => {
  Recognizer.startListening(params)
}

const recognizerStopListening = () => {
  Recognizer.stopListening()
}

/**
 * Safe, lifecycle-aware hook to use the recognizer.
 */
export const useRecognizer = (
  callbacks: RecognizerCallbacks
): RecognizerHandlers => {
  React.useEffect(() => {
    Recognizer.onReadyForSpeech = () => {
      callbacks.onReadyForSpeech?.()
    }
    Recognizer.onRecordingStopped = () => {
      callbacks.onRecordingStopped?.()
    }
    Recognizer.onResult = (resultBatches: string[]) => {
      callbacks.onResult?.(resultBatches)
    }
    Recognizer.onAutoFinishProgress = (timeLeftMs: number) => {
      callbacks.onAutoFinishProgress?.(timeLeftMs)
    }
    Recognizer.onError = (message: string) => {
      callbacks.onError?.(message)
    }
    Recognizer.onPermissionDenied = () => {
      callbacks.onPermissionDenied?.()
    }
    return () => {
      Recognizer.onReadyForSpeech = undefined
      Recognizer.onRecordingStopped = undefined
      Recognizer.onResult = undefined
      Recognizer.onAutoFinishProgress = undefined
      Recognizer.onError = undefined
      Recognizer.onPermissionDenied = undefined
    }
  }, [callbacks])

  React.useEffect(() => {
    return () => {
      Recognizer.stopListening()
    }
  }, [])

  return {
    startListening: recognizerStartListening,
    stopListening: recognizerStopListening,
  }
}

export type { RecognizerCallbacks, RecognizerHandlers, SpeechToTextParams }
