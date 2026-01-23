import type { Recognizer as RecognizerSpec, SpeechToTextParams } from './specs/NitroSpeech.nitro';
/**
 * Unsafe access to the recognizer object for the NitroSpeech module.
 */
export declare const Recognizer: RecognizerSpec;
type RecognizerCallbacks = Pick<RecognizerSpec, 'onReadyForSpeech' | 'onRecordingStopped' | 'onResult' | 'onAutoFinishProgress' | 'onError' | 'onPermissionDenied'>;
type RecognizerHandlers = Pick<RecognizerSpec, 'startListening' | 'stopListening'>;
/**
 * Safe, lifecycle-aware hook to use the recognizer.
 */
export declare const useRecognizer: (callbacks: RecognizerCallbacks) => RecognizerHandlers;
export type { RecognizerCallbacks, RecognizerHandlers, SpeechToTextParams };
//# sourceMappingURL=index.d.ts.map