package com.margelo.nitro.nitrospeech.tts

import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.nitrospeech.HybridTTSSpec

class HybridTTS: HybridTTSSpec() {
  companion object {
    private const val TAG = "HybridTTS"
  }

  @DoNotStrip
  @Keep
  override fun add(a: Double, b: Double): Double {
    return a + b
  }
}
