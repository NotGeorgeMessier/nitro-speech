import { useSyncExternalStore } from 'react'

type TSubscriber = () => void

const subscribers = new Set<TSubscriber>()

const subscribe = (subscriber: TSubscriber) => {
  subscribers.add(subscriber)
  return () => subscribers.delete(subscriber)
}

let current = false

const getCurrent = () => {
  return current
}

/**
 * Returns true if the speech recognition session is active.
 */
export const useRecognizerIsActive = () => {
  return useSyncExternalStore(subscribe, getCurrent)
}

/**
 * Direct access to default Speech Recognizer isActive state change handler.
 *
 * In case you use static Speech Recognizer:
 *
 * ```typescript
 * import { speechRecognizerActiveStateHandler } from 'react-native-nitro-speech'
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
export const speechRecognizerActiveStateHandler = (isActive: boolean) => {
  if (isActive === current) {
    return
  }
  current = isActive
  subscribers.forEach((subscriber) => subscriber?.())
}
