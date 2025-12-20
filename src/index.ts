import { NitroModules } from 'react-native-nitro-modules'
import type { Math } from './specs/Example.nitro'

export const NitroSpeech = NitroModules.createHybridObject<Math>('Math')
