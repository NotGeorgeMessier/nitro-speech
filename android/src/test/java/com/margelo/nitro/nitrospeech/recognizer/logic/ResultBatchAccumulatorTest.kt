package com.margelo.nitro.nitrospeech.recognizer.logic

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ResultBatchAccumulatorTest {
  @Test
  fun emptyPartialIsSkipped() {
    val acc = ResultBatchAccumulator(disableRepeatingFilter = false, disableBatchHandling = false)
    assertNull(acc.onPartial(""))
    assertNull(acc.snapshot())
  }

  @Test
  fun firstPartialIsStoredUnfiltered() {
    val acc = ResultBatchAccumulator(disableRepeatingFilter = false, disableBatchHandling = false)
    assertEquals(listOf("and and hello"), acc.onPartial("and and hello"))
  }

  @Test
  fun laterPartialsApplyRepeatingFilter() {
    val acc = ResultBatchAccumulator(disableRepeatingFilter = false, disableBatchHandling = false)
    acc.onPartial("hello")
    assertEquals(listOf("hello world"), acc.onPartial("hello hello world"))
  }

  @Test
  fun disableRepeatingFilterKeepsDuplicates() {
    val acc = ResultBatchAccumulator(disableRepeatingFilter = true, disableBatchHandling = false)
    acc.onPartial("hello")
    assertEquals(listOf("hello hello world"), acc.onPartial("hello hello world"))
  }

  @Test
  fun shorterMatchStartsNewBatch() {
    val acc = ResultBatchAccumulator(disableRepeatingFilter = true, disableBatchHandling = false)
    acc.onPartial("this is a fairly long partial result")
    val next = acc.onPartial("new")
    assertEquals(2, next!!.size)
    assertEquals("new", next.last())
  }

  @Test
  fun disableBatchHandlingAlwaysAppends() {
    val acc = ResultBatchAccumulator(disableRepeatingFilter = true, disableBatchHandling = true)
    acc.onPartial("hello")
    assertEquals(listOf("hello", "hello world"), acc.onPartial("hello world"))
  }

  @Test
  fun snapshotIsACopy() {
    val acc = ResultBatchAccumulator(disableRepeatingFilter = true, disableBatchHandling = false)
    acc.onPartial("hello")
    val snap = acc.snapshot()
    acc.onPartial("hello world")
    assertEquals(listOf("hello"), snap)
    assertEquals(listOf("hello world"), acc.snapshot())
  }

  @Test
  fun resetClearsBatches() {
    val acc = ResultBatchAccumulator(disableRepeatingFilter = true, disableBatchHandling = false)
    acc.onPartial("hello")
    acc.reset()
    assertNull(acc.snapshot())
  }
}
