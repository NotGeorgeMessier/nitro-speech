import React from 'react'
import type {
  NitroSpeech as NitroSpeechSpec,
  Recognizer as RecognizerSpec,
  SpeechToTextParams,
  VolumeChangeEvent,
} from './specs/NitroSpeech.nitro'
import { createNitroSpeechHybridObject } from '../nitrogen/generated/shared/ts/createNitroSpeechHybridObject'

const NitroSpeech =
  createNitroSpeechHybridObject<NitroSpeechSpec>('NitroSpeech')

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
  | 'onVolumeChange'
>

type RecognizerHandlers = Pick<
  RecognizerSpec,
  | 'startListening'
  | 'stopListening'
  | 'addAutoFinishTime'
  | 'updateAutoFinishTime'
  | 'getIsActive'
  | 'getSupportedLocalesIOS'
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

const recognizerGetIsActive = () => {
  return RecognizerSession.getIsActive()
}

const recognizerGetSupportedLocalesIOS = () => {
  return RecognizerSession.getSupportedLocalesIOS()
}

const subscribers = new Set<RecognizerSpec['onVolumeChange']>()

let current: VolumeChangeEvent = {
  smoothedVolume: 0,
  rawVolume: 0,
  db: undefined,
}

let snapshot: VolumeChangeEvent = { ...current }

const getSnapshot = () => {
  if (
    snapshot.smoothedVolume === current.smoothedVolume &&
    snapshot.rawVolume === current.rawVolume &&
    snapshot.db === current.db
  ) {
    return snapshot
  }
  snapshot = { ...current }
  return snapshot
}

/**
 * Subscription to the voice input volume changes
 *
 * Updates with arbitrary frequency (many times per second) while audio recording is active.
 *
 * @returns The current voice input volume normalized to a range of 0 to 1.
 */
export const useVoiceInputVolume = () => {
  return React.useSyncExternalStore((subscriber) => {
    subscribers.add(subscriber)
    return () => subscribers.delete(subscriber)
  }, getSnapshot)
}

const handleVolumeChange: RecognizerSpec['onVolumeChange'] = (event) => {
  if (
    event.smoothedVolume === current.smoothedVolume &&
    event.rawVolume === current.rawVolume &&
    event.db === current.db
  ) {
    return
  }
  current = event
  subscribers.forEach((subscriber) => subscriber?.(event))
}

/**
 * Unsafe access to default Recognizer Session's volume change handler.
 *
 * In case you use static Recognizer Session:
 *
 * ```typescript
 * import { unsafe_onVolumeChange } from '@gmessier/nitro-speech'
 *
 * RecognizerSession.onVolumeChange = unsafe_onVolumeChange
 * ... // do something
 * RecognizerSession.startListening({ locale: 'en-US' })
 * ```
 */
export const unsafe_onVolumeChange = handleVolumeChange

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
    if (callbacks.onVolumeChange) {
      RecognizerSession.onVolumeChange = (event) => {
        callbacks.onVolumeChange?.(event)
      }
    } else {
      RecognizerSession.onVolumeChange = handleVolumeChange
    }
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
      RecognizerSession.onVolumeChange = undefined
    }
  }, [callbacks])

  React.useEffect(() => {
    return () => {
      RecognizerSession.stopListening()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...destroyDeps])

  return {
    startListening: recognizerStartListening,
    stopListening: recognizerStopListening,
    addAutoFinishTime: recognizerAddAutoFinishTime,
    updateAutoFinishTime: recognizerUpdateAutoFinishTime,
    getIsActive: recognizerGetIsActive,
    getSupportedLocalesIOS: recognizerGetSupportedLocalesIOS,
  }
}

/**
 * Safe reference to the Recognizer methods.
 */
export const RecognizerRef: RecognizerHandlers = {
  startListening: recognizerStartListening,
  stopListening: recognizerStopListening,
  addAutoFinishTime: recognizerAddAutoFinishTime,
  updateAutoFinishTime: recognizerUpdateAutoFinishTime,
  getIsActive: recognizerGetIsActive,
  getSupportedLocalesIOS: recognizerGetSupportedLocalesIOS,
}

export type { RecognizerCallbacks, RecognizerHandlers, SpeechToTextParams }
