import { NitroSpeech } from '../NitroSpeech'

/**
 * Static Speech Recognizer instance.
 *
 * Direct access to the all Speech Recognizer methods and callbacks.
 *
 * @note unsafe, might lead to race conditions
 */
export const SpeechRecognizer = NitroSpeech.recognizer
