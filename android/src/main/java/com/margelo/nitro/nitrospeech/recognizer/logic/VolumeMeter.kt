package com.margelo.nitro.nitrospeech.recognizer.logic

import kotlin.math.max
import kotlin.math.roundToInt

data class VolumeSample(
  val smoothedVolume: Double,
  val rawVolume: Double,
  val db: Double?,
)

class VolumeMeter {
  companion object {
    const val SPEECH_LEVEL_THRESHOLD = 0.35
    private const val FLOOR_RISE_ALPHA = 0.01f
    private const val FLOOR_FALL_ALPHA = 0.20f
    private const val PEAK_ATTACK_ALPHA = 0.25f
    private const val PEAK_DECAY_ALPHA = 0.01f
    private const val METER_ATTACK = 0.35f
    private const val METER_RELEASE = 0.08f
    private const val MIN_SPAN_DB = 6f
    private const val PRECISION_SCALE = 1_000_000f
  }

  private var noiseFloorDb = Float.NaN
  private var peakDb = Float.NaN
  private var levelSmoothed = 0f

  fun reset() {
    noiseFloorDb = Float.NaN
    peakDb = Float.NaN
    levelSmoothed = 0f
  }

  fun process(rmsdB: Float): VolumeSample {
    if (!rmsdB.isFinite()) {
      return VolumeSample(0.0, 0.0, null)
    }

    if (noiseFloorDb.isNaN()) {
      noiseFloorDb = rmsdB
    }
    if (peakDb.isNaN()) {
      peakDb = rmsdB + MIN_SPAN_DB
    }

    val floorAlpha = if (rmsdB < noiseFloorDb) FLOOR_FALL_ALPHA else FLOOR_RISE_ALPHA
    noiseFloorDb += floorAlpha * (rmsdB - noiseFloorDb)

    val peakAlpha = if (rmsdB > peakDb) PEAK_ATTACK_ALPHA else PEAK_DECAY_ALPHA
    peakDb += peakAlpha * (rmsdB - peakDb)

    val span = max(peakDb - noiseFloorDb, MIN_SPAN_DB)
    val raw = ((rmsdB - noiseFloorDb) / span).coerceIn(0f, 1f)
    val smoothingCoeff = if (raw > levelSmoothed) METER_ATTACK else METER_RELEASE
    levelSmoothed += smoothingCoeff * (raw - levelSmoothed)
    val roundedSmoothed = ((levelSmoothed * PRECISION_SCALE).roundToInt() / PRECISION_SCALE).toDouble()
    val roundedRaw = ((raw * PRECISION_SCALE).roundToInt() / PRECISION_SCALE).toDouble()
    val db = (rmsdB * 1000).roundToInt() / 1000.0

    return VolumeSample(
      smoothedVolume = roundedSmoothed,
      rawVolume = roundedRaw,
      db = db,
    )
  }

  fun shouldResetTimer(rawVolume: Double, sensitivity: Double?): Boolean {
    val threshold = (sensitivity ?: SPEECH_LEVEL_THRESHOLD).coerceIn(0.0, 1.0)
    return threshold < 1 && rawVolume > threshold
  }
}
