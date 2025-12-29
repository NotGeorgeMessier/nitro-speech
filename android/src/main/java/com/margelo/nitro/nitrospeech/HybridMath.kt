package com.margelo.nitro.nitrospeech

import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.nitrospeech.HybridMathSpec

class HybridMath: HybridMathSpec() {
  companion object {
    private const val TAG = "HybridMath"
  }

  @DoNotStrip
  @Keep
  override fun add(a: Double, b: Double): Double {
    return a + b
  }
}
