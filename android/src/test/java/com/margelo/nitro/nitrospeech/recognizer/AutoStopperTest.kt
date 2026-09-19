package com.margelo.nitro.nitrospeech.recognizer

import android.os.Looper
import java.time.Duration
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33])
class AutoStopperTest {
  @Test
  fun clampMsEnforcesMinimumAndFinite() {
    assertEquals(50.0, AutoStopper.clampMs(0.0), 0.0)
    assertEquals(50.0, AutoStopper.clampMs(-12.0), 0.0)
    assertEquals(50.0, AutoStopper.clampMs(Double.NaN), 0.0)
    assertEquals(50.0, AutoStopper.clampMs(Double.POSITIVE_INFINITY), 0.0)
    assertEquals(250.0, AutoStopper.clampMs(250.0), 0.0)
  }

  @Test
  fun resetEmitsProgressThenTimeout() {
    val progress = mutableListOf<Double>()
    var timedOut = false
    val stopper = AutoStopper(100.0, 50.0, { progress.add(it) }, { timedOut = true })

    stopper.resetTimer()
    assertEquals(listOf(100.0), progress)

    val looper = Shadows.shadowOf(Looper.getMainLooper())
    looper.idleFor(Duration.ofMillis(60))
    assertEquals(listOf(100.0, 50.0), progress)
    assertFalse(timedOut)

    looper.idleFor(Duration.ofMillis(60))
    assertTrue(timedOut)
    assertEquals(50.0, progress.last(), 0.0)
  }

  @Test
  fun stopPreventsTimeout() {
    var timedOut = false
    val stopper = AutoStopper(80.0, 50.0, {}, { timedOut = true })
    stopper.resetTimer()
    stopper.stop()
    Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(250))
    assertFalse(timedOut)
  }

  @Test
  fun addMsOnceExtendsTimeLeft() {
    val progress = mutableListOf<Double>()
    var timedOut = false
    val stopper = AutoStopper(80.0, 50.0, { progress.add(it) }, { timedOut = true })
    stopper.resetTimer()
    stopper.addMsOnce(200.0)
    assertTrue(progress.last() > 80.0)

    Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(400))
    assertTrue(timedOut)
  }

  @Test
  fun addMsOnceIgnoredWhenStoppedOrNonFinite() {
    val progress = mutableListOf<Double>()
    val stopper = AutoStopper(200.0, 50.0, { progress.add(it) }, {})
    stopper.resetTimer()
    val before = progress.size
    stopper.stop()
    stopper.addMsOnce(500.0)
    assertEquals(before, progress.size)

    val live = AutoStopper(200.0, 50.0, { progress.add(it) }, {})
    live.resetTimer()
    val afterReset = progress.size
    live.addMsOnce(Double.NaN)
    assertEquals(afterReset, progress.size)
  }

  @Test
  fun defaultThresholdIsEightSeconds() {
    val progress = mutableListOf<Double>()
    val stopper = AutoStopper(null, null, { progress.add(it) }, {})
    stopper.resetTimer()
    assertEquals(8000.0, progress.first(), 0.0)
    stopper.stop()
  }
}
