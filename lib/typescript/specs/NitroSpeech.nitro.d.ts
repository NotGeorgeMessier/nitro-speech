import { type HybridObject } from 'react-native-nitro-modules';
interface ParamsAndroid {
    /**
     * Default - false
     *
     * Prefer quality over latency (may break autofinish timing, depends on engine)
     *
     * Android 13+
     */
    androidFormattingPreferQuality?: boolean;
    /**
     * Default - false
     *
     * Language model based on web search terms. (may not work on some devices)
     *
     * Default - free form model
     */
    androidUseWebSearchModel?: boolean;
    /**
     * Default - false.
     *
     * If required to handle batches non-default way.
     *
     * Will add lots of batches with empty or similar content to the result.
     */
    androidDisableBatchHandling?: boolean;
}
type IosPreset = 'shortForm' | 'general';
interface ParamsIOS {
    /**
     * Default - true
     *
     * Adds punctuation to speech recognition results
     *
     * iOS 16+
     */
    iosAddPunctuation?: boolean;
    /**
     * Default - "general"
     *
     * "shortForm" - for a short phrase or sentence, also disables punctuation
     *
     * "general" - for longer speeches, more accurate but delayed response
     *
     * iOS 26+:
     */
    iosPreset?: IosPreset;
    /**
     * Default - false
     *
     * A processing hint indicating that the audio is from a speaker with a heavy accent, lisp, or other confounding factor.
     *
     * iOS 26+
     */
    iosAtypicalSpeech?: boolean;
}
type HapticFeedbackStyle = 'light' | 'medium' | 'heavy' | 'none';
export interface SpeechToTextParams extends ParamsAndroid, ParamsIOS {
    /**
     * Default - "en-US"
     */
    locale?: string;
    /**
     * Default - 8s
     */
    autoFinishRecognitionMs?: number;
    /**
     * Default - false
     *
     * Lots of repeating words in a row can be annoying
     */
    disableRepeatingFilter?: boolean;
    /**
     * Default - empty array
     *
     * An array of strings that should be recognized, even if they are not in the system vocabulary.
     */
    contextualStrings?: string[];
    /**
     * Default - "medium"
     *
     * Haptic feedback style when microphone starts recording.
     */
    startHapticFeedbackStyle?: HapticFeedbackStyle;
    /**
     * Default - "medium"
     *
     * Haptic feedback style when microphone stops recording.
     */
    stopHapticFeedbackStyle?: HapticFeedbackStyle;
    /**
     * Default - false
     *
     * Android 13+
     *
     * iOS 26+ (iOS <26: always `false`)
     */
    maskOffensiveWords?: boolean;
}
export interface Recognizer extends HybridObject<{
    ios: 'swift';
    android: 'kotlin';
}> {
    /**
     * Tries to start the speech recognition.
     *
     * Not guaranteed to start the speech recognition.
     */
    startListening(params: SpeechToTextParams): void;
    /**
     * Stops the speech recognition. if not started, does nothing.
     *
     * Not a sync operation for android, delay about 250ms to polish the result.
     *
     * Use onRecordingStopped to handle the stop event.
     */
    stopListening(): void;
    /**
     * Manually adds time to the auto finish progress.
     *
     * If you want to give the user ability to manually increase time before timer calls stop.
     *
     * @param additionalTimeMs - time in ms to add to the current auto finish timer. If not set, will reset the timer to the original auto finish time.
     */
    addAutoFinishTime(additionalTimeMs?: number): void;
    /**
     * Updates the auto finish time.
     *
     * Applies changes only within the current recognition session.
     *
     * @param newTimeMs - new time in ms for the auto finish timer.
     * @param withRefresh - if true, will refresh the auto finish progress.
     */
    updateAutoFinishTime(newTimeMs: number, withRefresh?: boolean): void;
    /**
     * Returns true if the speech recognition is active.
     */
    getIsActive(): boolean;
    /**
     * Returns a list of supported locales. for iOS only.
     *
     * No available API for Android.
     */
    getSupportedLocalesIOS(): string[];
    /**
     * The speech recognition has started.
     */
    onReadyForSpeech?: () => void;
    /**
     * Audio recording has stopped.
     */
    onRecordingStopped?: () => void;
    /**
     * Called each time either a new batch has been added or the last batch has been updated.
     */
    onResult?: (resultBatches: string[]) => void;
    /**
     * Called each second while auto finish is in progress.
     *
     * Time left in milliseconds. Always more than 1000ms.
     *
     * TODO: Add for android
     */
    onAutoFinishProgress?: (timeLeftMs: number) => void;
    /**
     * Error of the speech recognition.
     */
    onError?: (message: string) => void;
    /**
     * Permission to record audio has been denied.
     */
    onPermissionDenied?: () => void;
    /**
     * Called with arbitrary frequency (many times per second) while audio recording is active.
     *
     * Voice input volume normalized to a range of 0 to 1.
     */
    onVolumeChange?: (normVolume: number) => void;
}
export interface NitroSpeech extends HybridObject<{
    ios: 'swift';
    android: 'kotlin';
}> {
    recognizer: Recognizer;
}
export {};
//# sourceMappingURL=NitroSpeech.nitro.d.ts.map