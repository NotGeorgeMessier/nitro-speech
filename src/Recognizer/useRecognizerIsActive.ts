import { useSyncExternalStore } from 'react'

type OnActiveStateChange = (isActive: boolean) => void

const subscribers = new Set<OnActiveStateChange>()

let recognizerIsActive = false

const getSnapshot = () => {
  return recognizerIsActive
}

/**
 * Returns true if the speech recognition session is active.
 */
export const useRecognizerIsActive = () => {
  return useSyncExternalStore((subscriber) => {
    subscribers.add(subscriber)
    return () => subscribers.delete(subscriber)
  }, getSnapshot)
}

/**
 * Direct access to default Speech Recognizer isActive state change handler.
 *
 * In case you use static Speech Recognizer:
 *
 * ```typescript
 * import { speechRecognizerActiveStateHandler } from '@gmessier/nitro-speech'
 *
 * SpeechRecognizer.onReadyForSpeech = () => {
 *   speechRecognizerActiveStateHandler(true)
 * }
 * SpeechRecognizer.onRecordingStopped = () => {
 *   speechRecognizerActiveStateHandler(false)
 * }
 * ... // setup everything else
 * SpeechRecognizer.startListening({ locale: 'en-US' })
 * ```
 */
export const speechRecognizerActiveStateHandler: OnActiveStateChange = (
  isActive
) => {
  if (isActive === recognizerIsActive) {
    return
  }
  recognizerIsActive = isActive
  subscribers.forEach((subscriber) => subscriber?.(isActive))
}
