"use strict";

import React from 'react';
import { NitroModules } from 'react-native-nitro-modules';
const NitroSpeech = NitroModules.createHybridObject('NitroSpeech');

/**
 * Unsafe access to the Recognizer Session.
 */
export const RecognizerSession = NitroSpeech.recognizer;
const recognizerStartListening = params => {
  RecognizerSession.startListening(params);
};
const recognizerStopListening = () => {
  RecognizerSession.stopListening();
};
const recognizerAddAutoFinishTime = additionalTimeMs => {
  RecognizerSession.addAutoFinishTime(additionalTimeMs);
};
const recognizerUpdateAutoFinishTime = (newTimeMs, withRefresh) => {
  RecognizerSession.updateAutoFinishTime(newTimeMs, withRefresh);
};
const recognizerGetIsActive = () => {
  return RecognizerSession.getIsActive();
};
const subscribers = new Set();
let currentVolume = 0;

/**
 * Subscription to the voice input volume changes
 *
 * Updates with arbitrary frequency (many times per second) while audio recording is active.
 *
 * @returns The current voice input volume normalized to a range of 0 to 1.
 */
export const useVoiceInputVolume = () => {
  return React.useSyncExternalStore(subscriber => {
    subscribers.add(subscriber);
    return () => subscribers.delete(subscriber);
  }, () => currentVolume);
};
const handleVolumeChange = normVolume => {
  if (normVolume === currentVolume) return;
  currentVolume = normVolume;
  subscribers.forEach(subscriber => subscriber?.(normVolume));
};

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
export const unsafe_onVolumeChange = handleVolumeChange;

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
export const useRecognizer = (callbacks, destroyDeps = []) => {
  React.useEffect(() => {
    if (callbacks.onVolumeChange) {
      RecognizerSession.onVolumeChange = normVolume => {
        callbacks.onVolumeChange?.(normVolume);
      };
    } else {
      RecognizerSession.onVolumeChange = handleVolumeChange;
    }
    RecognizerSession.onReadyForSpeech = () => {
      callbacks.onReadyForSpeech?.();
    };
    RecognizerSession.onRecordingStopped = () => {
      callbacks.onRecordingStopped?.();
    };
    RecognizerSession.onResult = resultBatches => {
      callbacks.onResult?.(resultBatches);
    };
    RecognizerSession.onAutoFinishProgress = timeLeftMs => {
      callbacks.onAutoFinishProgress?.(timeLeftMs);
    };
    RecognizerSession.onError = message => {
      callbacks.onError?.(message);
    };
    RecognizerSession.onPermissionDenied = () => {
      callbacks.onPermissionDenied?.();
    };
    return () => {
      RecognizerSession.onReadyForSpeech = undefined;
      RecognizerSession.onRecordingStopped = undefined;
      RecognizerSession.onResult = undefined;
      RecognizerSession.onAutoFinishProgress = undefined;
      RecognizerSession.onError = undefined;
      RecognizerSession.onPermissionDenied = undefined;
      RecognizerSession.onVolumeChange = undefined;
    };
  }, [callbacks]);
  React.useEffect(() => {
    return () => {
      RecognizerSession.stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...destroyDeps]);
  return {
    startListening: recognizerStartListening,
    stopListening: recognizerStopListening,
    addAutoFinishTime: recognizerAddAutoFinishTime,
    updateAutoFinishTime: recognizerUpdateAutoFinishTime,
    getIsActive: recognizerGetIsActive
  };
};

/**
 * Safe reference to the Recognizer methods.
 */
export const RecognizerRef = {
  startListening: recognizerStartListening,
  stopListening: recognizerStopListening,
  addAutoFinishTime: recognizerAddAutoFinishTime,
  updateAutoFinishTime: recognizerUpdateAutoFinishTime,
  getIsActive: recognizerGetIsActive
};
//# sourceMappingURL=index.js.map