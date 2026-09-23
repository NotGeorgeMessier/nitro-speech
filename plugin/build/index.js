"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withIos_1 = require("./withIos");
const PACKAGE_NAME = 'react-native-nitro-speech';
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
const withNitroSpeech = (config, props = {}) => {
    return (0, withIos_1.withNitroSpeechIos)(config, props);
};
const withNitroSpeechPlugin = (0, config_plugins_1.createRunOncePlugin)(withNitroSpeech, PACKAGE_NAME);
exports.default = withNitroSpeechPlugin;
