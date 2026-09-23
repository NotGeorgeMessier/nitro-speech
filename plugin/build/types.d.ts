export interface NitroSpeechPluginProps {
    /**
     * iOS `NSMicrophoneUsageDescription`.
     * @default 'This app needs microphone access for speech recognition'
     */
    microphonePermission?: string;
    /**
     * iOS `NSSpeechRecognitionUsageDescription`.
     * @default 'This app needs speech recognition to convert speech to text'
     */
    speechRecognitionPermission?: string;
}
