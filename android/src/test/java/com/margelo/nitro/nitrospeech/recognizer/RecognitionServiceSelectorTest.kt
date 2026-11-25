package com.margelo.nitro.nitrospeech.recognizer

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class RecognitionServiceSelectorTest {
  private val googleTts = InstalledRecognitionService(
    packageName = "com.google.android.tts",
    className = "com.google.android.apps.speech.tts.googletts.service.GoogleTTSRecognitionService",
  )
  private val quickSearch = InstalledRecognitionService(
    packageName = "com.google.android.googlequicksearchbox",
    className = "com.google.android.voicesearch.serviceapi.GoogleRecognitionService",
  )

  @Test
  fun keepsSystemDefaultWhenAServiceIsSelected() {
    val selected = "com.google.android.googlequicksearchbox/com.google.android.voicesearch.serviceapi.GoogleRecognitionService"
    val selection = RecognitionServiceSelector.select(
      defaultService = selected,
      installed = listOf(googleTts, quickSearch),
    )
    assertEquals(RecognitionServiceSelection.SystemDefault, selection)
  }

  @Test
  fun keepsSystemDefaultEvenIfNoServiceIsVisible() {
    // A configured default must not be replaced or turned into the "none installed" error.
    val selection = RecognitionServiceSelector.select(
      defaultService = "com.example.speech/.Recognizer",
      installed = emptyList(),
    )
    assertEquals(RecognitionServiceSelection.SystemDefault, selection)
  }

  @Test
  fun fallsBackToTheFirstInstalledServiceWhenUnset() {
    val selection = RecognitionServiceSelector.select(
      defaultService = null,
      installed = listOf(googleTts, quickSearch),
    )
    assertEquals(
      RecognitionServiceSelection.Explicit(googleTts.packageName, googleTts.className),
      selection,
    )
  }

  @Test
  fun treatsEmptyAndBlankSettingsAsUnset() {
    val empty = RecognitionServiceSelector.select("", listOf(quickSearch, googleTts))
    val blank = RecognitionServiceSelector.select("  \t", listOf(quickSearch, googleTts))
    val expected = RecognitionServiceSelection.Explicit(
      quickSearch.packageName,
      quickSearch.className,
    )
    assertEquals(expected, empty)
    assertEquals(expected, blank)
  }

  @Test
  fun skipsBlankComponentEntries() {
    val selection = RecognitionServiceSelector.select(
      defaultService = null,
      installed = listOf(
        InstalledRecognitionService(packageName = "", className = "com.example.Empty"),
        InstalledRecognitionService(packageName = "com.example", className = " "),
        googleTts,
      ),
    )
    assertEquals(
      RecognitionServiceSelection.Explicit(googleTts.packageName, googleTts.className),
      selection,
    )
  }

  @Test
  fun reportsNoneAvailableWhenNothingIsInstalled() {
    val fromNull = RecognitionServiceSelector.select(null, emptyList())
    val fromEmpty = RecognitionServiceSelector.select("", emptyList())
    val fromBlankEntries = RecognitionServiceSelector.select(
      null,
      listOf(InstalledRecognitionService("", "")),
    )
    assertEquals(RecognitionServiceSelection.NoneAvailable, fromNull)
    assertEquals(RecognitionServiceSelection.NoneAvailable, fromEmpty)
    assertEquals(RecognitionServiceSelection.NoneAvailable, fromBlankEntries)
  }

  @Test
  fun settingsKeyIsThePlatformSecureSetting() {
    // SpeechRecognizer reads this exact Settings.Secure name. The SDK constant is hidden.
    assertEquals("voice_recognition_service", RecognitionServiceSelector.SETTINGS_KEY)
  }

  @Test
  fun missingServiceTraceNamesTheUnsetDefault() {
    assertEquals(
      "HybridRecognizer.start.OnDeviceSupport.createRecognizer.noRecognitionService",
      RecognitionServiceSelector.missingServiceTrace(),
    )
    assertTrue(NoRecognitionServiceException().message!!.contains("voice_recognition_service"))
  }
}
