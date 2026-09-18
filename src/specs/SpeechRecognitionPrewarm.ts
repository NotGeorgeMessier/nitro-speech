export interface SpeechRecognitionPrewarm {
  /**
   * If permission is not granted, will request it.
   *
   * if permission is set, does nothing.
   *
   * @default true
   */
  requestPermission?: boolean
  /**
   * Will try to load the on-device model **ONLY IF** `defaultParams.onDevice: "require" | "prefer"`.
   *
   * If `onDevice` is unset - step is ignored.
   *
   * If `onDevice: "require"` - will load model OR fail with `OnDeviceNotSupported` | `OnDeviceModelNotInstalled`
   *
   * If `onDevice: "prefer"` - will try to load model OR fallback to remote model
   *
   * @default true
   */
  loadOnDeviceModel?: boolean
}
