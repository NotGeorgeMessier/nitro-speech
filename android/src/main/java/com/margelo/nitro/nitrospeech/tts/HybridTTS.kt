package com.margelo.nitro.nitrospeech.tts

import java.util.Locale
import android.os.Handler
import android.os.Looper
import android.speech.tts.TextToSpeech
import android.util.Log
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import com.margelo.nitro.nitrospeech.HybridTTSSpec
import com.margelo.nitro.nitrospeech.TTSParams
import kotlin.math.log

class HybridTTS : HybridTTSSpec() {

  companion object {
    private const val TAG = "HybridTTS"
    private val CONFIG: TTSParams = TTSParams(
      1.0,
      1.0,
      1.0,
      false,
      "en-US"
    )
  }

  private var tts: TextToSpeech? = null
  private var isInitialized: Boolean = false
  private var isSpeakingState: Boolean = false
  private val mainHandler = Handler(Looper.getMainLooper())
  @Keep
  @DoNotStrip
  override fun speak(text: String, params: TTSParams) {
    Log.d(TAG, "Speak with params: $params")
    
    val context = NitroModules.applicationContext
    if (context == null) {
      Log.e(TAG, "Context not available")
      return
    }

    // Destroy existing TTS if any
    destroyTts()

    mainHandler.post {
      tts = TextToSpeech(context) { status ->
        if (status == TextToSpeech.SUCCESS) {
          isInitialized = true
          
          val locale = Locale.forLanguageTag(params.locale ?: CONFIG.locale ?: "en-US")
          tts?.language = locale
          tts?.setSpeechRate((params.rate ?: CONFIG.rate ?: 1.0).toFloat())
          tts?.setPitch((params.pitch ?: CONFIG.pitch ?: 1.0).toFloat())
          
          isSpeakingState = true
          tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "utterance_${System.currentTimeMillis()}")
          Log.d(TAG, "Speaking: $text")
        } else {
          Log.e(TAG, "TTS initialization failed with status: $status")
          isInitialized = false
        }
      }

      Log.d(TAG, "default engine${tts?.defaultEngine ?: "null"}")
    }
  }

  @Keep
  @DoNotStrip
  override fun stop() {
    Log.d(TAG, "Stop")
    mainHandler.post {
      tts?.stop()
      isSpeakingState = false
    }
  }

  private fun destroyTts() {
    mainHandler.post {
      tts?.stop()
      tts?.shutdown()
      tts = null
      isInitialized = false
      isSpeakingState = false
      Log.d(TAG, "TTS destroyed")
    }
  }

  @Keep
  @DoNotStrip
  override fun isSpeaking(): Promise<Boolean> {
    Log.d(TAG, "isSpeaking: $isSpeakingState")
    return Promise.resolved(isSpeakingState)
  }

  @Keep
  @DoNotStrip
  override fun pause(): Promise<Boolean> {
    Log.d(TAG, "Pause - not implemented")
    return Promise.resolved(false)
  }

  @Keep
  @DoNotStrip
  override fun resume(): Promise<Boolean> {
    Log.d(TAG, "Resume - not implemented")
    return Promise.resolved(false)
  }

  @Keep
  @DoNotStrip
  override fun add(a: Double, b: Double): Double {
    return a + b
  }
}
