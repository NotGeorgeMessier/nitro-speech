/* eslint-disable react-hooks/exhaustive-deps */
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
 * Unsafe access to the Recognizer Session.
 */
export const RecognizerSession = NitroSpeech.recognizer

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
  | 'startListening'
  | 'stopListening'
  | 'addAutoFinishTime'
  | 'updateAutoFinishTime'
>

const recognizerStartListening = (params: SpeechToTextParams) => {
  RecognizerSession.startListening(params)
}

const recognizerStopListening = () => {
  RecognizerSession.stopListening()
}

const recognizerAddAutoFinishTime = (additionalTimeMs?: number) => {
  RecognizerSession.addAutoFinishTime(additionalTimeMs)
}

const recognizerUpdateAutoFinishTime = (
  newTimeMs: number,
  withRefresh?: boolean
) => {
  RecognizerSession.updateAutoFinishTime(newTimeMs, withRefresh)
}

/**
 * Safe, lifecycle-aware hook to use the recognizer.
 *
 * @param callbacks - The callbacks to use for the recognizer.
 * @param destroyDeps - The additional dependencies to use for the cleanup effect.
 *
 * Example: To cleanup when the screen is unfocused.
 *
 * ```typescript
 * const isFocused = useIsFocused()
 * useRecognizer({ ... }, [isFocused])
 * ```
 */
export const useRecognizer = (
  callbacks: RecognizerCallbacks,
  destroyDeps: React.DependencyList = []
): RecognizerHandlers => {
  React.useEffect(() => {
    RecognizerSession.onReadyForSpeech = () => {
      callbacks.onReadyForSpeech?.()
    }
    RecognizerSession.onRecordingStopped = () => {
      callbacks.onRecordingStopped?.()
    }
    RecognizerSession.onResult = (resultBatches: string[]) => {
      callbacks.onResult?.(resultBatches)
    }
    RecognizerSession.onAutoFinishProgress = (timeLeftMs: number) => {
      callbacks.onAutoFinishProgress?.(timeLeftMs)
    }
    RecognizerSession.onError = (message: string) => {
      callbacks.onError?.(message)
    }
    RecognizerSession.onPermissionDenied = () => {
      callbacks.onPermissionDenied?.()
    }
    return () => {
      RecognizerSession.onReadyForSpeech = undefined
      RecognizerSession.onRecordingStopped = undefined
      RecognizerSession.onResult = undefined
      RecognizerSession.onAutoFinishProgress = undefined
      RecognizerSession.onError = undefined
      RecognizerSession.onPermissionDenied = undefined
    }
  }, [callbacks])

  React.useEffect(() => {
    return () => {
      RecognizerSession.stopListening()
    }
  }, [...destroyDeps])

  return {
    startListening: recognizerStartListening,
    stopListening: recognizerStopListening,
    addAutoFinishTime: recognizerAddAutoFinishTime,
    updateAutoFinishTime: recognizerUpdateAutoFinishTime,
  }
}

/**
 * Safe reference to the Recognizer methods.
 */
export const RecognizerRef = {
  startListening: recognizerStartListening,
  stopListening: recognizerStopListening,
  addAutoFinishTime: recognizerAddAutoFinishTime,
  updateAutoFinishTime: recognizerUpdateAutoFinishTime,
}

export type { RecognizerCallbacks, RecognizerHandlers, SpeechToTextParams }
