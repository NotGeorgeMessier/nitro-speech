package com.margelo.nitro.nitrospeech

import android.util.Log
import com.margelo.nitro.nitrospeech.HybridNitroSpeechSpec
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules

class HybridNitroSpeech : HybridNitroSpeechSpec() {
  companion object {
    private const val TAG = "HybridNitroSpeech"
  }

  override var onResult: ((text: String, isFinal: Boolean) -> Unit)? = null
  override var onError: ((error: String ) -> Unit)? = null

  @DoNotStrip
  @Keep
  override fun add(
    a: Double,
    b: Double
  ): Double {
    return a + b
  }

  @DoNotStrip
  @Keep
  override fun sub(
    a: Double,
    b: Double
  ): Double {
    return a - b
  }

  @DoNotStrip
  @Keep
  override fun doSomething(str: String): String {
    return "Hello, im doing $str"
  }

  override fun startListening(locale: String) {
    Log.d(TAG, "startListening called with locale: $locale")
  }

  override fun stopListening() {
    Log.d(TAG, "stopListening called")
    val onResult1 = onResult
    onResult1?.invoke("abc", true)
  }

  override fun destroy() {
    Log.d(TAG, "destroy")
  }

}