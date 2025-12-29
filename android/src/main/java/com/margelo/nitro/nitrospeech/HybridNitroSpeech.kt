package com.margelo.nitro.nitrospeech

import com.margelo.nitro.nitrospeech.HybridNitroSpeechSpec
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip

class HybridNitroSpeech: HybridNitroSpeechSpec() {

  @DoNotStrip
  @Keep
  override var recognizer: HybridRecognizerSpec = HybridRecognizer()

  @DoNotStrip
  @Keep
  override var math: HybridMathSpec = HybridMath()
}
