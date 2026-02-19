"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useRecognizer = exports.RecognizerSession = exports.RecognizerRef = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNativeNitroModules = require("react-native-nitro-modules");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/* eslint-disable react-hooks/exhaustive-deps */

const NitroSpeech = _reactNativeNitroModules.NitroModules.createHybridObject('NitroSpeech');

/**
 * Unsafe access to the Recognizer Session.
 */
const RecognizerSession = exports.RecognizerSession = NitroSpeech.recognizer;
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
const useRecognizer = (callbacks, destroyDeps = []) => {
  _react.default.useEffect(() => {
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
  _react.default.useEffect(() => {
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
exports.useRecognizer = useRecognizer;
const RecognizerRef = exports.RecognizerRef = {
  startListening: recognizerStartListening,
  stopListening: recognizerStopListening,
  addAutoFinishTime: recognizerAddAutoFinishTime,
  updateAutoFinishTime: recognizerUpdateAutoFinishTime
};
//# sourceMappingURL=index.js.map