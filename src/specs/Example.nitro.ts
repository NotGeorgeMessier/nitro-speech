import { type HybridObject } from 'react-native-nitro-modules'

export interface NitroSpeech extends HybridObject<{
  ios: 'swift'
  android: 'kotlin'
}> {
  add(a: number, b: number): number
  sub(a: number, b: number): number
  doSomething(str: string): string
}
