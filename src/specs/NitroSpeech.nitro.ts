import { type HybridObject } from 'react-native-nitro-modules'

export interface NitroSpeech extends HybridObject<{
  ios: 'swift'
  android: 'kotlin'
}> {
  add(a: number, b: number): number
  sub(a: number, b: number): number
  doSomething(str: string): string

  // Speech-to-text methods
  startListening(locale: string): void
  stopListening(): void
  destroy(): void

  // Callbacks for speech recognition events
  onResult?: (text: string, isFinal: boolean) => void
  onError?: (message: string) => void
}
