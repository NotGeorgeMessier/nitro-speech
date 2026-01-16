package com.margelo.nitro.nitrospeech

import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.nitrospeech.recognizer.HybridRecognizer

class HybridNitroSpeech: HybridNitroSpeechSpec() {

  @DoNotStrip
  @Keep
  override var recognizer: HybridRecognizerSpec = HybridRecognizer()
}
