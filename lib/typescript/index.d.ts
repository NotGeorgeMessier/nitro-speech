import React from 'react';
import type { Recognizer as RecognizerSpec, SpeechToTextParams } from './specs/NitroSpeech.nitro';
/**
 * Unsafe access to the recognizer object for the NitroSpeech module.
 */
export declare const Recognizer: RecognizerSpec;
type RecognizerCallbacks = Pick<RecognizerSpec, 'onReadyForSpeech' | 'onRecordingStopped' | 'onResult' | 'onAutoFinishProgress' | 'onError' | 'onPermissionDenied'>;
type RecognizerHandlers = Pick<RecognizerSpec, 'startListening' | 'stopListening' | 'addAutoFinishTime' | 'updateAutoFinishTime'>;
/**
 * Safe, lifecycle-aware hook to use the recognizer.
 *
 * @param callbacks - The callbacks to use for the recognizer.
 * @param destroyDeps - The additional dependencies to use for the cleanup effect.
 *
 * Example: To cleanup when the screen is unfocused.
 *
 * ```typescript
 * const isFocused = useIsFocused()
 * useRecognizer({ ... }, [isFocused])
 * ```
 */
export declare const useRecognizer: (callbacks: RecognizerCallbacks, destroyDeps?: React.DependencyList) => RecognizerHandlers;
export type { RecognizerCallbacks, RecognizerHandlers, SpeechToTextParams };
//# sourceMappingURL=index.d.ts.map