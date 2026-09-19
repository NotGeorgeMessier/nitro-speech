package com.margelo.nitro.nitrospeech.recognizer.logic

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LocaleTagsTest {
  @Test
  fun normalizeConvertsUnderscore() {
    assertEquals("en-US", LocaleTags.normalize("en_US"))
    assertEquals("en-US", LocaleTags.normalize("en-US"))
  }

  @Test
  fun isListedIsCaseInsensitiveAndNormalizes() {
    assertTrue(LocaleTags.isListed(listOf("en_us", "fr-FR"), "en-US"))
    assertTrue(LocaleTags.isListed(listOf("de-DE"), "de_de"))
    assertFalse(LocaleTags.isListed(listOf("fr-FR"), "en-US"))
  }
}
