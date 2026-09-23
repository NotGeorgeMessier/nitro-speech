import type { ConfigPlugin } from 'expo/config-plugins'
import { withInfoPlist } from 'expo/config-plugins'
import type { NitroSpeechPluginProps } from './types'

export const DEFAULT_MICROPHONE_PERMISSION =
  'This app needs microphone access for speech recognition'

export const DEFAULT_SPEECH_RECOGNITION_PERMISSION =
  'This app needs speech recognition to convert speech to text'

function resolveUsageDescription(
  override: string | undefined,
  existing: unknown,
  fallback: string
): string {
  if (typeof override === 'string' && override.length > 0) {
    return override
  }
  if (typeof existing === 'string' && existing.length > 0) {
    return existing
  }
  return fallback
}

export const withNitroSpeechIos: ConfigPlugin<NitroSpeechPluginProps> = (
  config,
  props = {}
) => {
  config.ios = config.ios ?? {}
  config.ios.infoPlist = config.ios.infoPlist ?? {}

  config.ios.infoPlist.NSMicrophoneUsageDescription = resolveUsageDescription(
    props.microphonePermission,
    config.ios.infoPlist.NSMicrophoneUsageDescription,
    DEFAULT_MICROPHONE_PERMISSION
  )
  config.ios.infoPlist.NSSpeechRecognitionUsageDescription =
    resolveUsageDescription(
      props.speechRecognitionPermission,
      config.ios.infoPlist.NSSpeechRecognitionUsageDescription,
      DEFAULT_SPEECH_RECOGNITION_PERMISSION
    )

  return withInfoPlist(config, (modConfig) => {
    modConfig.modResults.NSMicrophoneUsageDescription = resolveUsageDescription(
      props.microphonePermission,
      modConfig.modResults.NSMicrophoneUsageDescription,
      DEFAULT_MICROPHONE_PERMISSION
    )
    modConfig.modResults.NSSpeechRecognitionUsageDescription =
      resolveUsageDescription(
        props.speechRecognitionPermission,
        modConfig.modResults.NSSpeechRecognitionUsageDescription,
        DEFAULT_SPEECH_RECOGNITION_PERMISSION
      )
    return modConfig
  })
}
