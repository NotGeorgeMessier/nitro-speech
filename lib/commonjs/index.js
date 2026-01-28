"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useRecognizer = exports.Recognizer = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNativeNitroModules = require("react-native-nitro-modules");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/* eslint-disable react-hooks/exhaustive-deps */

const NitroSpeech = _reactNativeNitroModules.NitroModules.createHybridObject('NitroSpeech');

/**
 * Unsafe access to the recognizer object for the NitroSpeech module.
 */
const Recognizer = exports.Recognizer = NitroSpeech.recognizer;
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
const useRecognizer = (callbacks, destroyDeps = []) => {
  _react.default.useEffect(() => {
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
  _react.default.useEffect(() => {
    return () => {
      Recognizer.stopListening();
    };
  }, [...destroyDeps]);
  return {
    startListening: recognizerStartListening,
    stopListening: recognizerStopListening,
    addAutoFinishTime: recognizerAddAutoFinishTime,
    updateAutoFinishTime: recognizerUpdateAutoFinishTime
  };
};
exports.useRecognizer = useRecognizer;
//# sourceMappingURL=index.js.map