import { type HybridObject } from 'react-native-nitro-modules'

interface Params {
  /**
   * Default - "en-US"
   */
  locale?: string
  /**
   * Default - false
   */
  recognizeOnDevice?: boolean
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
   * Default - false.
   *
   * If required to handle batches non-default way.
   *
   * Will add lots of batches with empty or similar content to the result.
   */
  disableBatchHandling?: boolean
  /**
   * Default - false
   *
   * Mask offensive words.
   */
  androidMaskOffensiveWords?: boolean
}

export interface Recognizer extends HybridObject<{
  ios: 'swift'
  android: 'kotlin'
}> {
  // Speech-to-text methods
  startListening(params: Params): void
  stopListening(): void
  destroy(): void

  /**
   * User's speech is ready to be recognized.
   */
  onReadyForSpeech?: () => void
  /**
   * Audio recording has stopped.
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

export interface Math extends HybridObject<{
  ios: 'swift'
  android: 'kotlin'
}> {
  add(a: number, b: number): number
}

export interface NitroSpeech extends HybridObject<{
  ios: 'swift'
  android: 'kotlin'
}> {
  recognizer: Recognizer
  math: Math
}
