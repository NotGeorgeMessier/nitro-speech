package com.margelo.nitro.math
import com.margelo.nitro.core.*

class HybridNitroSpeech : HybridNitroSpeechSpec() {
  override fun add(a: Double,
                   b: Double): Double {
    return a + b
  }

  override fun sub(a: Double,
                   b: Double): Double {
    return a - b
  }

  override fun do(str: String): String {
    return "Hello, im doing $str"
  }
}