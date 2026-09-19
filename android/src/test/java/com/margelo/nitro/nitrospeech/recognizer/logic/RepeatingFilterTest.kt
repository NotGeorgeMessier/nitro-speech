package com.margelo.nitro.nitrospeech.recognizer.logic

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class RepeatingFilterTest {
  @Test
  fun uniqueWordsPassThrough() {
    assertEquals("hello world", RepeatingFilter.apply("hello world"))
  }

  @Test
  fun consecutiveDuplicatesAreDropped() {
    assertEquals("and then go", RepeatingFilter.apply("and and then then then go"))
  }

  @Test
  fun nonConsecutiveRepeatsAreKept() {
    assertEquals("go and go", RepeatingFilter.apply("go and go"))
  }

  @Test
  fun numberTokensAreAlwaysKept() {
    assertEquals("room 12 12 please", RepeatingFilter.apply("room 12 12 please"))
  }

  @Test
  fun blankInputIsEmpty() {
    assertEquals("", RepeatingFilter.apply("   "))
    assertEquals("", RepeatingFilter.apply(""))
  }

  @Test
  fun longUnstableTailIsFiltered() {
    val output = RepeatingFilter.apply("one two three four five six seven eight nine ten ten ten")
    assertTrue(output.startsWith("one two"))
    assertFalse(output.contains("ten ten"))
    assertTrue(output.endsWith("ten"))
  }
}
