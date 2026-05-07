import { useSyncExternalStore } from 'react'
import type { RecognizerSpec, VolumeChangeEvent } from './types'

type OnVolumeChange = RecognizerSpec['onVolumeChange']

const subscribers = new Set<OnVolumeChange>()

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
  return useSyncExternalStore((subscriber) => {
    subscribers.add(subscriber)
    return () => subscribers.delete(subscriber)
  }, getSnapshot)
}

/**
 * Direct access to default Speech Recognizer volume change handler.
 *
 * In case you use static Speech Recognizer:
 *
 * ```typescript
 * import { speechRecognizerVolumeChangeHandler } from '@gmessier/nitro-speech'
 *
 * SpeechRecognizer.onVolumeChange = speechRecognizerVolumeChangeHandler
 * ... // setup everything else
 * SpeechRecognizer.startListening({ locale: 'en-US' })
 * ```
 */
export const speechRecognizerVolumeChangeHandler: OnVolumeChange = (event) => {
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
