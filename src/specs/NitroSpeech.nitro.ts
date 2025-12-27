import { type HybridObject } from 'react-native-nitro-modules'

export interface NitroSpeech extends HybridObject<{
  ios: 'swift'
  android: 'kotlin'
}> {
  // Speech-to-text methods
  startListening(locale: string, recognizeOnDevice: boolean): void
  stopListening(): void
  destroy(): void

  // Callbacks for speech recognition events
  onResult?: (resultBatches: string[], isFinal: boolean) => void
  onError?: (message: string) => void
  onPermissionDenied?: () => void
}
