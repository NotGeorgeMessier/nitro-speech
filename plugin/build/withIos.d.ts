import type { ConfigPlugin } from 'expo/config-plugins';
import type { NitroSpeechPluginProps } from './types';
export declare const DEFAULT_MICROPHONE_PERMISSION = "This app needs microphone access for speech recognition";
export declare const DEFAULT_SPEECH_RECOGNITION_PERMISSION = "This app needs speech recognition to convert speech to text";
export declare const withNitroSpeechIos: ConfigPlugin<NitroSpeechPluginProps>;
