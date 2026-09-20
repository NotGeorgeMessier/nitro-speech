package com.margelo.nitro.nitrospeech.recognizer

import org.junit.Assert.assertEquals
import org.junit.Test

class ErrorTraceTest {
  @Test
  fun joinsDotSeparatedSegments() {
    assertEquals(
      "RecognitionListenerSession.onError",
      ErrorTrace.join("RecognitionListenerSession", "onError"),
    )
    assertEquals(
      "OnDeviceSupport.prepare.downloadModel",
      ErrorTrace.join("OnDeviceSupport", "prepare", "downloadModel"),
    )
  }

  @Test
  fun dropsEmptySegments() {
    assertEquals(
      "HybridRecognizer.prewarm",
      ErrorTrace.join("HybridRecognizer", "", "prewarm"),
    )
    assertEquals("", ErrorTrace.join(""))
  }
}
