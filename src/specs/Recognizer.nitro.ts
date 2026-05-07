import type { HybridObject } from 'react-native-nitro-modules'
import type {
  MutableSpeechRecognitionConfig,
  SpeechRecognitionConfig,
} from './SpeechRecognitionConfig'
import type { VolumeChangeEvent } from './VolumeChangeEvent'

export interface Recognizer extends HybridObject<{
  ios: 'swift'
  android: 'kotlin'
}> {
  /**
   * Prepare the speech recognition engine and the model for the given parameters.
   */
  prewarm(defaultParams?: SpeechRecognitionConfig): Promise<void>

  /**
   * Try to start the speech recognition.
   *
   * Not guaranteed to start the speech recognition.
   *
   * On success - {@linkcode onReadyForSpeech} is called
   *
   * On failure - {@linkcode onError} is called
   */
  startListening(params?: SpeechRecognitionConfig): void

  /**
   * Stops the speech recognition. if not started, does nothing.
   *
   * Not a sync operation for android, delay about 250ms to polish the result.
   *
   * Use {@linkcode onRecordingStopped} to handle the stop event.
   */
  stopListening(): void

  /**
   * Reset the auto finish timer to current {@linkcode SpeechRecognitionConfig.autoFinishRecognitionMs}.
   */
  resetAutoFinishTime(): void

  /**
   * Add time to the auto finish timer once without changing the timer threshold.
   *
   * @param additionalTimeMs - time in ms to add to the current auto finish timer. If not set, will reset the timer to the original {@linkcode SpeechRecognitionConfig.autoFinishRecognitionMs}.
   */
  addAutoFinishTime(additionalTimeMs?: number): void

  /**
   * Applies changes only within the active recognition session.
   *
   * @param newConfig - new dynamic params for the speech recognition.
   * @param resetAutoFinishTime - if true, will reset auto finish time to actual {@linkcode SpeechRecognitionConfig.autoFinishRecognitionMs}.
   */
  updateConfig(
    newConfig?: MutableSpeechRecognitionConfig,
    resetAutoFinishTime?: boolean
  ): void

  /**
   * Returns true if the speech recognition is active.
   */
  getIsActive(): boolean

  /**
   * Returns a list of supported locales.
   *
   * @platform iOS only
   */
  getSupportedLocalesIOS(): string[]

  /**
   * The speech recognition session has started.
   */
  onReadyForSpeech?: () => void
  /**
   * The speech recognition session has stopped.
   */
  onRecordingStopped?: () => void
  /**
   * Called each time either a new batch has been added or the last batch has been updated.
   */
  onResult?: (resultBatches: string[]) => void
  /**
   * Called every {@linkcode SpeechRecognitionConfig.autoFinishProgressIntervalMs} or 1000ms
   *
   * Time left in milliseconds until the timer stops.
   *
   * @note not implemented for Android yet.
   */
  onAutoFinishProgress?: (timeLeftMs: number) => void
  /**
   * Error of the speech recognition.
   */
  onError?: (message: string) => void
  /**
   * The permission to use the microphone or recognize speech has been denied.
   */
  onPermissionDenied?: () => void
  /**
   * Called with high and arbitrary frequency (many times per second) while audio recording is active.
   */
  onVolumeChange?: (event: VolumeChangeEvent) => void
}
