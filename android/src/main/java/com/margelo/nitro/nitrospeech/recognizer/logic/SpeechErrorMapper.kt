package com.margelo.nitro.nitrospeech.recognizer.logic

import android.speech.SpeechRecognizer

object SpeechErrorMapper {
  enum class Kind {
    RECOGNITION_TASK_FAILED,
    ON_DEVICE_NOT_SUPPORTED,
    ON_DEVICE_MODEL_NOT_INSTALLED,
  }

  fun map(error: Int, onDeviceConfigured: Boolean): Kind {
    if (onDeviceConfigured && error == SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE) {
      return Kind.ON_DEVICE_MODEL_NOT_INSTALLED
    }
    if (onDeviceConfigured && error == SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED) {
      return Kind.ON_DEVICE_NOT_SUPPORTED
    }
    return Kind.RECOGNITION_TASK_FAILED
  }

  fun message(error: Int): String {
    return when (error) {
      SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
      SpeechRecognizer.ERROR_CLIENT -> "Client side error"
      SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
      SpeechRecognizer.ERROR_NETWORK -> "Network error"
      SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
      SpeechRecognizer.ERROR_NO_MATCH -> "No match"
      SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognizer busy"
      SpeechRecognizer.ERROR_SERVER -> "Server error"
      SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input"
      SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE -> "Language model not installed"
      SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED -> "Language not supported"
      else -> "Unknown error"
    }
  }
}
