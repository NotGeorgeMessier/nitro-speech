import { useEffect, type DependencyList } from 'react'
import {
  recognizerResetAutoFinishTime,
  recognizerAddAutoFinishTime,
  recognizerUpdateConfig,
  recognizerGetIsActive,
  recognizerGetSupportedLocalesIOS,
  recognizerStartListening,
  recognizerStopListening,
} from './methods'
import type { RecognizerCallbacks, RecognizerMethods } from './types'
import { SpeechRecognizer } from './SpeechRecognizer'
import { speechRecognizerVolumeChangeHandler } from './useVoiceInputVolume'

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
  destroyDeps: DependencyList = []
): RecognizerMethods => {
  useEffect(() => {
    if (callbacks.onVolumeChange) {
      SpeechRecognizer.onVolumeChange = (event) => {
        callbacks.onVolumeChange?.(event)
      }
    } else {
      SpeechRecognizer.onVolumeChange = speechRecognizerVolumeChangeHandler
    }
    SpeechRecognizer.onReadyForSpeech = () => {
      callbacks.onReadyForSpeech?.()
    }
    SpeechRecognizer.onRecordingStopped = () => {
      callbacks.onRecordingStopped?.()
    }
    SpeechRecognizer.onResult = (resultBatches: string[]) => {
      callbacks.onResult?.(resultBatches)
    }
    SpeechRecognizer.onAutoFinishProgress = (timeLeftMs: number) => {
      callbacks.onAutoFinishProgress?.(timeLeftMs)
    }
    SpeechRecognizer.onError = (message: string) => {
      callbacks.onError?.(message)
    }
    SpeechRecognizer.onPermissionDenied = () => {
      callbacks.onPermissionDenied?.()
    }
    return () => {
      SpeechRecognizer.onReadyForSpeech = undefined
      SpeechRecognizer.onRecordingStopped = undefined
      SpeechRecognizer.onResult = undefined
      SpeechRecognizer.onAutoFinishProgress = undefined
      SpeechRecognizer.onError = undefined
      SpeechRecognizer.onPermissionDenied = undefined
      SpeechRecognizer.onVolumeChange = undefined
    }
  }, [callbacks])

  useEffect(() => {
    return () => {
      SpeechRecognizer.stopListening()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...destroyDeps])

  return {
    startListening: recognizerStartListening,
    stopListening: recognizerStopListening,
    resetAutoFinishTime: recognizerResetAutoFinishTime,
    addAutoFinishTime: recognizerAddAutoFinishTime,
    updateConfig: recognizerUpdateConfig,
    getIsActive: recognizerGetIsActive,
    getSupportedLocalesIOS: recognizerGetSupportedLocalesIOS,
  }
}
