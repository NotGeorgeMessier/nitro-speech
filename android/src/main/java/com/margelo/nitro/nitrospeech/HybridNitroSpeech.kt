package com.margelo.nitro.nitrospeech

import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import com.margelo.nitro.nitrospeech.HybridNitroSpeechSpec
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules

class HybridNitroSpeech: HybridNitroSpeechSpec() {
  companion object {
    private const val TAG = "HybridNitroSpeech"
  }

  private var resultBatches: ArrayList<String>? = null
  private var permissionRequester: AudioPermissionRequester? = null
  private var speechRecognizer: SpeechRecognizer? = null
  private val mainHandler = Handler(Looper.getMainLooper())

  override var onResult: ((resultBatches: Array<String>, isFinal: Boolean) -> Unit)? = null
  override var onError: ((error: String) -> Unit)? = null
  override var onPermissionDenied: (() -> Unit)? = null

  @DoNotStrip
  @Keep
  override fun startListening(locale: String, recognizeOnDevice: Boolean) {
    val context = NitroModules.applicationContext
    if (context == null) {
      onError?.invoke("Context not available")
      return
    }
    val activity = context.currentActivity
    if (activity == null) {
      onError?.invoke("Activity not found")
      return
    }

    if (permissionRequester == null) {
      permissionRequester = AudioPermissionRequester(activity)
    }

    permissionRequester?.checkAndRequest { granted ->
      if (!granted) {
        onPermissionDenied?.invoke()
        return@checkAndRequest
      }
      start(context, locale, recognizeOnDevice)
    }
  }

  @DoNotStrip
  @Keep
  override fun stopListening() {
    onResult?.invoke(resultBatches?.toTypedArray() ?: emptyArray(), true)
    mainHandler.postDelayed({
      try {
        speechRecognizer?.stopListening()
        Log.d(TAG, "stopListening called")
      } catch (e: Exception) {
        onError?.invoke(e.message ?: "Unknown error at stopListening")
      }
    }, 100)
  }


  @DoNotStrip
  @Keep
  override fun destroy() {
    resultBatches = null
    mainHandler.post {
      try {
        speechRecognizer?.destroy()
        speechRecognizer = null
        Log.d(TAG, "destroy called")
      } catch (e: Exception) {
        onError?.invoke(e.message ?: "Unknown error at destroy")
      }
    }
  }

  private fun start(context: Context ,locale: String, recognizeOnDevice: Boolean) {
    resultBatches = null
    mainHandler.post {
      try {
        if (speechRecognizer == null) {
          if (recognizeOnDevice && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && SpeechRecognizer.isOnDeviceRecognitionAvailable(context)) {
            speechRecognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(context)
          } else {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context)
          }
          speechRecognizer?.setRecognitionListener(createRecognitionListener())
        }

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale)
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        intent.putExtra(RecognizerIntent.EXTRA_RESULTS, true)
        // set 60s to avoid cutting early
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 60000)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          intent.putExtra(RecognizerIntent.EXTRA_MASK_OFFENSIVE_WORDS, false)
        }

        speechRecognizer?.startListening(intent)
        Log.d(TAG, "startListening called with locale: $locale")
      } catch (e: Exception) {
        onError?.invoke(e.message ?: "Unknown error")
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
          Log.d(TAG, "isFinal: true, $matches")
          onResult?.invoke(matches.slice(0..0).toTypedArray(), true)
        }
      }

      override fun onPartialResults(partialResults: Bundle?) {
        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        if (matches.isNullOrEmpty() || matches[0] == "") {
          Log.d(TAG, "onPartialResults[0], skip, NO RECOGNIZE")
          return
        }

        Log.d(TAG, "onPartialResults[0], add ${matches[0]}")
        var currentBatches = resultBatches
        if (currentBatches.isNullOrEmpty()) {
          Log.d(TAG, "onPartialResults[1], EMPTY BATCHES | add first")
          currentBatches = arrayListOf(matches[0])
        } else {
          Log.d(TAG, "onPartialResults[1], current batches $currentBatches")
          val prevBatchLength = currentBatches[currentBatches.lastIndex].length
          val matchLength = matches[0].length
          if (matchLength + 3 >= prevBatchLength) {
            Log.d(TAG, "onPartialResults[2], continue batch, replace ${currentBatches.lastIndex}")
            currentBatches[currentBatches.lastIndex] = matches[0]
          } else {
            Log.d(TAG, "onPartialResults[2], append new batch")
            currentBatches.add(matches[0])
          }
        }
        resultBatches = currentBatches
        onResult?.invoke(currentBatches.toTypedArray(), false)
      }

      override fun onEvent(eventType: Int, params: Bundle?) {}
    }
  }
}
