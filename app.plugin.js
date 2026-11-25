const { IOSConfig, createRunOncePlugin } = require('expo/config-plugins')
const pkg = require('./package.json')

const withNitroSpeech = (config, props) => {
  const { microphonePermission, speechRecognitionPermission } = props ?? {}

  return IOSConfig.Permissions.createPermissionsPlugin({
    NSMicrophoneUsageDescription:
      'This app needs microphone access for speech recognition',
    NSSpeechRecognitionUsageDescription:
      'This app needs speech recognition to convert speech to text',
  })(config, {
    NSMicrophoneUsageDescription: microphonePermission,
    NSSpeechRecognitionUsageDescription: speechRecognitionPermission,
  })
}

module.exports = createRunOncePlugin(withNitroSpeech, pkg.name, pkg.version)
