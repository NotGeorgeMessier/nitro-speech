package com.margelo.nitro.nitrospeech.recognizer.logic

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class VolumeMeterTest {
  @Test
  fun nonFiniteRmsReturnsZeros() {
    val meter = VolumeMeter()
    val sample = meter.process(Float.NaN)
    assertEquals(0.0, sample.smoothedVolume, 0.0)
    assertEquals(0.0, sample.rawVolume, 0.0)
    assertNull(sample.db)
  }

  @Test
  fun firstSampleUsesMinSpan() {
    val meter = VolumeMeter()
    val sample = meter.process(0f)
    assertEquals(0.0, sample.rawVolume, 0.0001)
    assertEquals(0.0, sample.db!!, 0.0001)
  }

  @Test
  fun louderSampleRaisesRawVolume() {
    val meter = VolumeMeter()
    meter.process(-20f)
    val louder = meter.process(-8f)
    assertTrue(louder.rawVolume > 0.4)
    assertEquals(-8.0, louder.db!!, 0.001)
    assertTrue(louder.smoothedVolume > 0)
  }

  @Test
  fun shouldResetTimerHonorsSensitivity() {
    val meter = VolumeMeter()
    assertTrue(meter.shouldResetTimer(0.4, null))
    assertFalse(meter.shouldResetTimer(0.35, null))
    assertFalse(meter.shouldResetTimer(1.0, 1.0))
    assertTrue(meter.shouldResetTimer(0.11, 0.1))
  }

  @Test
  fun resetClearsFloorState() {
    val meter = VolumeMeter()
    meter.process(-6f)
    meter.reset()
    val sample = meter.process(-20f)
    assertEquals(0.0, sample.rawVolume, 0.0001)
  }
}
