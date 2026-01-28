import { type HybridObject } from 'react-native-nitro-modules';
interface ParamsAndroid {
    /**
     * Default - false
     *
     * Min Android 13
     */
    androidMaskOffensiveWords?: boolean;
    /**
     * Default - false
     *
     * Prefer quality over latency (may break autofinish timing, depends on engine)
     *
     * Min Android 13
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
interface ParamsIOS {
    /**
     * Default - true
     *
     * Adds punctuation to speech recognition results
     *
     * Min iOS 16
     */
    iosAddPunctuation?: boolean;
}
type HapticFeedbackStyle = 'light' | 'medium' | 'heavy';
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
     * Default - null
     *
     * Haptic feedback style when microphone starts recording.
     */
    startHapticFeedbackStyle?: HapticFeedbackStyle;
    /**
     * Default - null
     *
     * Haptic feedback style when microphone stops recording.
     */
    stopHapticFeedbackStyle?: HapticFeedbackStyle;
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
     * The speech recognition has started.
     */
    onReadyForSpeech?: () => void;
    /**
     * Audio recording has stopped. (may be called multiple times for one recording)
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
}
export interface NitroSpeech extends HybridObject<{
    ios: 'swift';
    android: 'kotlin';
}> {
    recognizer: Recognizer;
}
export {};
//# sourceMappingURL=NitroSpeech.nitro.d.ts.map