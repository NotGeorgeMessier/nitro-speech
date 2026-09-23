"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withNitroSpeechIos = exports.DEFAULT_SPEECH_RECOGNITION_PERMISSION = exports.DEFAULT_MICROPHONE_PERMISSION = void 0;
const config_plugins_1 = require("expo/config-plugins");
exports.DEFAULT_MICROPHONE_PERMISSION = 'This app needs microphone access for speech recognition';
exports.DEFAULT_SPEECH_RECOGNITION_PERMISSION = 'This app needs speech recognition to convert speech to text';
function resolveUsageDescription(override, existing, fallback) {
    if (typeof override === 'string' && override.length > 0) {
        return override;
    }
    if (typeof existing === 'string' && existing.length > 0) {
        return existing;
    }
    return fallback;
}
const withNitroSpeechIos = (config, props = {}) => {
    var _a, _b;
    config.ios = (_a = config.ios) !== null && _a !== void 0 ? _a : {};
    config.ios.infoPlist = (_b = config.ios.infoPlist) !== null && _b !== void 0 ? _b : {};
    config.ios.infoPlist.NSMicrophoneUsageDescription = resolveUsageDescription(props.microphonePermission, config.ios.infoPlist.NSMicrophoneUsageDescription, exports.DEFAULT_MICROPHONE_PERMISSION);
    config.ios.infoPlist.NSSpeechRecognitionUsageDescription =
        resolveUsageDescription(props.speechRecognitionPermission, config.ios.infoPlist.NSSpeechRecognitionUsageDescription, exports.DEFAULT_SPEECH_RECOGNITION_PERMISSION);
    return (0, config_plugins_1.withInfoPlist)(config, (modConfig) => {
        modConfig.modResults.NSMicrophoneUsageDescription =
            resolveUsageDescription(props.microphonePermission, modConfig.modResults.NSMicrophoneUsageDescription, exports.DEFAULT_MICROPHONE_PERMISSION);
        modConfig.modResults.NSSpeechRecognitionUsageDescription =
            resolveUsageDescription(props.speechRecognitionPermission, modConfig.modResults.NSSpeechRecognitionUsageDescription, exports.DEFAULT_SPEECH_RECOGNITION_PERMISSION);
        return modConfig;
    });
};
exports.withNitroSpeechIos = withNitroSpeechIos;
