"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useVoiceInputVolume = exports.useRecognizer = exports.unsafe_onVolumeChange = exports.RecognizerSession = exports.RecognizerRef = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNativeNitroModules = require("react-native-nitro-modules");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
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
const recognizerGetIsActive = () => {
  return RecognizerSession.getIsActive();
};
const recognizerGetSupportedLocalesIOS = () => {
  return RecognizerSession.getSupportedLocalesIOS();
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
const useVoiceInputVolume = () => {
  return _react.default.useSyncExternalStore(subscriber => {
    subscribers.add(subscriber);
    return () => subscribers.delete(subscriber);
  }, () => currentVolume);
};
exports.useVoiceInputVolume = useVoiceInputVolume;
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
const unsafe_onVolumeChange = exports.unsafe_onVolumeChange = handleVolumeChange;

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
  _react.default.useEffect(() => {
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
    getIsActive: recognizerGetIsActive,
    getSupportedLocalesIOS: recognizerGetSupportedLocalesIOS
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
  updateAutoFinishTime: recognizerUpdateAutoFinishTime,
  getIsActive: recognizerGetIsActive,
  getSupportedLocalesIOS: recognizerGetSupportedLocalesIOS
};
//# sourceMappingURL=index.js.map