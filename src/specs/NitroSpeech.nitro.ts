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
   * Default - 60s
   */
  autoFinishRecognitionMs?: number
  /**
   * Default - true
   *
   * Min Android 13
   */
  maskOffensiveWords?: boolean
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
}

export interface Recognizer extends HybridObject<{
  ios: 'swift'
  android: 'kotlin'
}> {
  // Speech-to-text methods
  startListening(params: Params): void
  stopListening(): void
  destroy(): void

  // Callbacks for speech recognition events
  onReadyForSpeech?: () => void
  onEndOfSpeech?: () => void
  onResult?: (resultBatches: string[], isFinal: boolean) => void
  onError?: (message: string) => void
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
