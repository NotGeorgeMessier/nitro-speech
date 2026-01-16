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
}
export interface Recognizer extends HybridObject<{
    ios: 'swift';
    android: 'kotlin';
}> {
    startListening(params: SpeechToTextParams): void;
    stopListening(): void;
    destroy(): void;
    /**
     * User's speech is ready to be recognized.
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