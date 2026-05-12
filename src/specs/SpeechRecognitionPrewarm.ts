export interface SpeechRecognitionPrewarm {
  /**
   * If permission is not granted, will request it.
   *
   * if permission is set, does nothing.
   *
   * @default true
   */
  requestPermission?: boolean
}
