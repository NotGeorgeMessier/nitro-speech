"use strict";

/* eslint-disable react-hooks/exhaustive-deps */
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
    };
  }, [callbacks]);
  React.useEffect(() => {
    return () => {
      RecognizerSession.stopListening();
    };
  }, [...destroyDeps]);
  return {
    startListening: recognizerStartListening,
    stopListening: recognizerStopListening,
    addAutoFinishTime: recognizerAddAutoFinishTime,
    updateAutoFinishTime: recognizerUpdateAutoFinishTime
  };
};

/**
 * Safe reference to the Recognizer methods.
 */
export const RecognizerRef = {
  startListening: recognizerStartListening,
  stopListening: recognizerStopListening,
  addAutoFinishTime: recognizerAddAutoFinishTime,
  updateAutoFinishTime: recognizerUpdateAutoFinishTime
};
//# sourceMappingURL=index.js.map