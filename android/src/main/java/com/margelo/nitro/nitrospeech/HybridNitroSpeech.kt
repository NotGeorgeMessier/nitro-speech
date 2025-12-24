package com.margelo.nitro.nitrospeech

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import androidx.activity.ComponentActivity
import com.margelo.nitro.nitrospeech.HybridNitroSpeechSpec
import androidx.annotation.Keep
import androidx.core.content.ContextCompat
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules

class HybridNitroSpeech: HybridNitroSpeechSpec() {
  companion object {
    private const val TAG = "HybridNitroSpeech"
  }

  private var permissionRequester: AudioPermissionRequester? = null
  private var speechRecognizer: SpeechRecognizer? = null
  private val mainHandler = Handler(Looper.getMainLooper())

  override var onResult: ((text: String, isFinal: Boolean) -> Unit)? = null
  override var onError: ((error: String) -> Unit)? = null

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

  @DoNotStrip
  @Keep
  override fun startListening(locale: String) {
    val activity = NitroModules.applicationContext?.currentActivity
    if (activity == null) {
      onError?.invoke("No activity found")
      return
    }

    if (permissionRequester == null) {
      permissionRequester = AudioPermissionRequester(activity)
    }

    permissionRequester?.checkAndRequest { granted ->
      if (!granted) {
        onError?.invoke("Permission is not granted")
        return@checkAndRequest
      }
      start(locale)
    }
  }

  @DoNotStrip
  @Keep
  override fun stopListening() {
    mainHandler.post {
      try {
        speechRecognizer?.stopListening()
        Log.d(TAG, "stopListening called")
      } catch (e: Exception) {
        onError?.invoke(e.message ?: "Unknown error")
      }
    }
  }

  @DoNotStrip
  @Keep
  override fun destroy() {
    mainHandler.post {
      try {
        speechRecognizer?.destroy()
        speechRecognizer = null
        Log.d(TAG, "destroy called")
      } catch (e: Exception) {
        // Ignore
      }
    }
  }

  private fun createRecognitionListener(): RecognitionListener {
    return object : RecognitionListener {
      override fun onReadyForSpeech(params: Bundle?) {}
      override fun onBeginningOfSpeech() {}
      override fun onRmsChanged(rmsdB: Float) {}
      override fun onBufferReceived(buffer: ByteArray?) {}
      override fun onEndOfSpeech() {}

      override fun onError(error: Int) {
        val message = when (error) {
          SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
          SpeechRecognizer.ERROR_CLIENT -> "Client side error"
          SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
          SpeechRecognizer.ERROR_NETWORK -> "Network error"
          SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
          SpeechRecognizer.ERROR_NO_MATCH -> "No match"
          SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognizer busy"
          SpeechRecognizer.ERROR_SERVER -> "Server error"
          SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input"
          else -> "Unknown error"
        }
        onError?.invoke(message)
      }

      override fun onResults(results: Bundle?) {
        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        if (!matches.isNullOrEmpty()) {
          onResult?.invoke(matches[0], true)
        }
      }

      override fun onPartialResults(partialResults: Bundle?) {
        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        if (!matches.isNullOrEmpty()) {
          onResult?.invoke(matches[0], false)
        }
      }

      override fun onEvent(eventType: Int, params: Bundle?) {}
    }
  }

  private fun start(locale: String) {
    val context = NitroModules.applicationContext
    if (context == null) {
      onError?.invoke("Context not available")
      return
    }

    mainHandler.post {
      try {
        if (speechRecognizer == null) {
          speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context)
          speechRecognizer?.setRecognitionListener(createRecognitionListener())
        }

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale)
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)

        speechRecognizer?.startListening(intent)
        Log.d(TAG, "startListening called with locale: $locale")
      } catch (e: Exception) {
        onError?.invoke(e.message ?: "Unknown error")
      }
    }
  }
}
