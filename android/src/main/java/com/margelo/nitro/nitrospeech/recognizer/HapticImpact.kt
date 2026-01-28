package com.margelo.nitro.nitrospeech.recognizer

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import com.margelo.nitro.nitrospeech.HapticFeedbackStyle

class HapticImpact(
  private val style: HapticFeedbackStyle = HapticFeedbackStyle.MEDIUM,
) {
  private data class LegacyOneShot(
    val durationMs: Long,
    val amplitude: Int,
  )

  fun trigger(context: Context) {
    val vibrator = getVibrator(context) ?: return
    if (!vibrator.hasVibrator()) return

    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val effect = when (style) {
          HapticFeedbackStyle.LIGHT -> VibrationEffect.EFFECT_TICK
          HapticFeedbackStyle.MEDIUM -> VibrationEffect.EFFECT_CLICK
          HapticFeedbackStyle.HEAVY -> VibrationEffect.EFFECT_HEAVY_CLICK
        }
        vibrator.vibrate(VibrationEffect.createPredefined(effect))
        return
      }

      val legacyOneShot = when (style) {
        HapticFeedbackStyle.LIGHT -> LegacyOneShot(durationMs = 12L, amplitude = 50)
        HapticFeedbackStyle.MEDIUM -> LegacyOneShot(durationMs = 18L, amplitude = 100)
        HapticFeedbackStyle.HEAVY -> LegacyOneShot(durationMs = 28L, amplitude = 180)
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        vibrator.vibrate(
          VibrationEffect.createOneShot(
            legacyOneShot.durationMs,
            legacyOneShot.amplitude
          )
        )
      } else {
        @Suppress("DEPRECATION")
        vibrator.vibrate(legacyOneShot.durationMs)
      }
    } catch (_: SecurityException) {
      // Missing android.permission.VIBRATE or disallowed by device policy.
    } catch (_: Throwable) {
      // Never crash the recognition flow because of haptics.
    }
  }

  private fun getVibrator(context: Context): Vibrator? {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val manager =
        context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
      manager?.defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }
  }
}
