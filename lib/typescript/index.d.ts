import React from 'react';
import type { Recognizer as RecognizerSpec, SpeechToTextParams } from './specs/NitroSpeech.nitro';
/**
 * Unsafe access to the Recognizer Session.
 */
export declare const RecognizerSession: RecognizerSpec;
type RecognizerCallbacks = Pick<RecognizerSpec, 'onReadyForSpeech' | 'onRecordingStopped' | 'onResult' | 'onAutoFinishProgress' | 'onError' | 'onPermissionDenied' | 'onVolumeChange'>;
type RecognizerHandlers = Pick<RecognizerSpec, 'startListening' | 'stopListening' | 'addAutoFinishTime' | 'updateAutoFinishTime' | 'getIsActive'>;
/**
 * Subscription to the voice input volume changes
 *
 * Updates with arbitrary frequency (many times per second) while audio recording is active.
 *
 * @returns The current voice input volume normalized to a range of 0 to 1.
 */
export declare const useVoiceInputVolume: () => number;
/**
 * Unsafe access to default Recognizer Session's volume change handler.
 *
 * In case you use static Recognizer Session:
 *
 * ```typescript
 * import { unsafe_onVolumeChange } from '@gmessier/nitro-speech'
 *
 * RecognizerSession.onVolumeChange = unsafe_onVolumeChange
 * ... // do something
 * RecognizerSession.startListening({ locale: 'en-US' })
 * ```
 */
export declare const unsafe_onVolumeChange: (normVolume: number) => void;
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
/**
 * Safe reference to the Recognizer methods.
 */
export declare const RecognizerRef: RecognizerHandlers;
export type { RecognizerCallbacks, RecognizerHandlers, SpeechToTextParams };
//# sourceMappingURL=index.d.ts.map