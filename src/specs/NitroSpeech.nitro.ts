import { type HybridObject } from 'react-native-nitro-modules'

interface ParamsAndroid {
  /**
   * Default - false
   *
   * Min Android 13
   */
  androidMaskOffensiveWords?: boolean
  /**
   * Default - false
   *
   * Prefer quality over latency (may break autofinish timing, depends on engine)
   *
   * Min Android 13
   */
  androidFormattingPreferQuality?: boolean
  /**
   * Default - false
   *
   * Language model based on web search terms. (may not work on some devices)
   *
   * Default - free form model
   */
  androidUseWebSearchModel?: boolean
  /**
   * Default - false.
   *
   * If required to handle batches non-default way.
   *
   * Will add lots of batches with empty or similar content to the result.
   */
  androidDisableBatchHandling?: boolean
}

interface ParamsIOS {
  /**
   * Default - true
   *
   * Adds punctuation to speech recognition results
   *
   * Min iOS 16
   */
  iosAddPunctuation?: boolean
}

export interface SpeechToTextParams extends ParamsAndroid, ParamsIOS {
  /**
   * Default - "en-US"
   */
  locale?: string
  /**
   * Default - 8s
   */
  autoFinishRecognitionMs?: number
  /**
   * Default - false
   *
   * Lots of repeating words in a row can be annoying
   */
  disableRepeatingFilter?: boolean
  /**
   * Default - empty array
   *
   * An array of strings that should be recognized, even if they are not in the system vocabulary.
   */
  contextualStrings?: string[]
}

export interface Recognizer extends HybridObject<{
  ios: 'swift'
  android: 'kotlin'
}> {
  // Speech-to-text methods
  startListening(params: SpeechToTextParams): void
  stopListening(): void
  destroy(): void

  /**
   * User's speech is ready to be recognized.
   */
  onReadyForSpeech?: () => void
  /**
   * Audio recording has stopped. (may be called multiple times for one recording)
   */
  onRecordingStopped?: () => void
  /**
   * Called each time either a new batch has been added or the last batch has been updated.
   */
  onResult?: (resultBatches: string[]) => void
  /**
   * Error of the speech recognition.
   */
  onError?: (message: string) => void
  /**
   * Permission to record audio has been denied.
   */
  onPermissionDenied?: () => void
}

export interface TTSParams {
  rate?: number
  pitch?: number
  volume?: number
  ducking?: boolean
  locale?: string
}

export interface TTS extends HybridObject<{
  ios: 'swift'
  android: 'kotlin'
}> {
  add(a: number, b: number): number

  speak(text: string, params: TTSParams): void
  isSpeaking(): Promise<boolean>
  stop(): void
  pause(): Promise<boolean>
  resume(): Promise<boolean>
}

export interface NitroSpeech extends HybridObject<{
  ios: 'swift'
  android: 'kotlin'
}> {
  recognizer: Recognizer
  tts: TTS
}
