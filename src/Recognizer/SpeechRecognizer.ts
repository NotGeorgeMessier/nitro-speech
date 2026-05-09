import { NitroSpeech } from '../NitroSpeech'

/**
 * Static Speech Recognizer instance.
 *
 * Direct access to the all Speech Recognizer methods and callbacks.
 *
 * @note Unsafe, might lead to race conditions
 * @warning Since it reflects the original hybrid object, its API may change in the future.
 */
export const SpeechRecognizer = NitroSpeech.recognizer
