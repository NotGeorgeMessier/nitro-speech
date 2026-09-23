import type { ConfigPlugin } from 'expo/config-plugins'
import { createRunOncePlugin } from 'expo/config-plugins'
import type { NitroSpeechPluginProps } from './types'
import { withNitroSpeechIos } from './withIos'

const PACKAGE_NAME = 'react-native-nitro-speech'

/**
 * Expo config plugin for `react-native-nitro-speech`.
 *
 * iOS: writes `NSMicrophoneUsageDescription` and
 * `NSSpeechRecognitionUsageDescription` during prebuild.
 *
 * Android: `RECORD_AUDIO`, `VIBRATE`, and the `RecognitionService` queries
 * entry are already declared in this library's `AndroidManifest.xml` and
 * merge into the host app. They are not duplicated here.
 */
const withNitroSpeech: ConfigPlugin<NitroSpeechPluginProps> = (
  config,
  props = {}
) => {
  return withNitroSpeechIos(config, props)
}

const withNitroSpeechPlugin = createRunOncePlugin(withNitroSpeech, PACKAGE_NAME)

export type { NitroSpeechPluginProps }
export default withNitroSpeechPlugin
