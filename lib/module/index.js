"use strict";

import React from 'react';
import { NitroModules } from 'react-native-nitro-modules';
const NitroSpeech = NitroModules.createHybridObject('NitroSpeech');

/**
 * Unsafe access to the recognizer object for the NitroSpeech module.
 */
export const Recognizer = NitroSpeech.recognizer;
const recognizerStartListening = params => {
  Recognizer.startListening(params);
};
const recognizerStopListening = () => {
  Recognizer.stopListening();
};
const recognizerAddAutoFinishTime = additionalTimeMs => {
  Recognizer.addAutoFinishTime(additionalTimeMs);
};
const recognizerUpdateAutoFinishTime = (newTimeMs, withRefresh) => {
  Recognizer.updateAutoFinishTime(newTimeMs, withRefresh);
};

/**
 * Safe, lifecycle-aware hook to use the recognizer.
 */
export const useRecognizer = callbacks => {
  React.useEffect(() => {
    Recognizer.onReadyForSpeech = () => {
      callbacks.onReadyForSpeech?.();
    };
    Recognizer.onRecordingStopped = () => {
      callbacks.onRecordingStopped?.();
    };
    Recognizer.onResult = resultBatches => {
      callbacks.onResult?.(resultBatches);
    };
    Recognizer.onAutoFinishProgress = timeLeftMs => {
      callbacks.onAutoFinishProgress?.(timeLeftMs);
    };
    Recognizer.onError = message => {
      callbacks.onError?.(message);
    };
    Recognizer.onPermissionDenied = () => {
      callbacks.onPermissionDenied?.();
    };
    return () => {
      Recognizer.onReadyForSpeech = undefined;
      Recognizer.onRecordingStopped = undefined;
      Recognizer.onResult = undefined;
      Recognizer.onAutoFinishProgress = undefined;
      Recognizer.onError = undefined;
      Recognizer.onPermissionDenied = undefined;
    };
  }, [callbacks]);
  React.useEffect(() => {
    return () => {
      Recognizer.stopListening();
    };
  }, []);
  return {
    startListening: recognizerStartListening,
    stopListening: recognizerStopListening,
    addAutoFinishTime: recognizerAddAutoFinishTime,
    updateAutoFinishTime: recognizerUpdateAutoFinishTime
  };
};
//# sourceMappingURL=index.js.map