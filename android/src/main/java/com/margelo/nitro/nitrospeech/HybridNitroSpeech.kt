package com.margelo.nitro.nitrospeech

import com.margelo.nitro.nitrospeech.HybridNitroSpeechSpec
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules

class HybridNitroSpeech : HybridNitroSpeechSpec() {
  @DoNotStrip
  @Keep
  override fun add(a: Double,
                   b: Double): Double {
    return a + b
  }

  @DoNotStrip
  @Keep
  override fun sub(a: Double,
                   b: Double): Double {
    return a - b
  }

  @DoNotStrip
  @Keep
  override fun doSomething(str: String): String {
    return "Hello, im doing $str"
  }
}