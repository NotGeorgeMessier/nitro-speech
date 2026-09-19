package com.margelo.nitro.nitrospeech.recognizer.logic

import android.speech.SpeechRecognizer
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33])
class SpeechErrorMapperTest {
  @Test
  fun emulatorSilenceTimeoutMapsToRecognitionTaskFailed() {
    assertEquals(
      SpeechErrorMapper.Kind.RECOGNITION_TASK_FAILED,
      SpeechErrorMapper.map(SpeechRecognizer.ERROR_SPEECH_TIMEOUT, false),
    )
    assertEquals("No speech input", SpeechErrorMapper.message(SpeechRecognizer.ERROR_SPEECH_TIMEOUT))
  }

  @Test
  fun onDeviceLanguageErrorsMapOnlyWhenOnDeviceConfigured() {
    assertEquals(
      SpeechErrorMapper.Kind.ON_DEVICE_MODEL_NOT_INSTALLED,
      SpeechErrorMapper.map(SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE, true),
    )
    assertEquals(
      SpeechErrorMapper.Kind.ON_DEVICE_NOT_SUPPORTED,
      SpeechErrorMapper.map(SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED, true),
    )
    assertEquals(
      SpeechErrorMapper.Kind.RECOGNITION_TASK_FAILED,
      SpeechErrorMapper.map(SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE, false),
    )
  }

  @Test
  fun genericErrorsMapToTaskFailed() {
    assertEquals(
      SpeechErrorMapper.Kind.RECOGNITION_TASK_FAILED,
      SpeechErrorMapper.map(SpeechRecognizer.ERROR_CLIENT, true),
    )
    assertEquals(
      SpeechErrorMapper.Kind.RECOGNITION_TASK_FAILED,
      SpeechErrorMapper.map(SpeechRecognizer.ERROR_NO_MATCH, false),
    )
  }

  @Test
  fun messagesCoverKnownCodes() {
    assertEquals("Audio recording error", SpeechErrorMapper.message(SpeechRecognizer.ERROR_AUDIO))
    assertEquals("Network timeout", SpeechErrorMapper.message(SpeechRecognizer.ERROR_NETWORK_TIMEOUT))
    assertEquals("Unknown error", SpeechErrorMapper.message(999))
  }
}
