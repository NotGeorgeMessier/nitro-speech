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
import androidx.annotation.Keep
import androidx.annotation.RequiresApi
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules
import com.margelo.nitro.nitrospeech.HybridRecognizerSpec
import com.margelo.nitro.nitrospeech.Params

class HybridRecognizer: HybridRecognizerSpec() {
  companion object {
    private const val TAG = "HybridRecognizer"
  }

  private var config: Params? = null
  private var resultBatches: ArrayList<String>? = null
  private var permissionRequester: AudioPermissionRequester? = null
  private var speechRecognizer: SpeechRecognizer? = null
  private val mainHandler = Handler(Looper.getMainLooper())

  override var onReadyForSpeech: (() -> Unit)? = null
  override var onEndOfSpeech: (() -> Unit)? = null
  override var onResult: ((resultBatches: Array<String>, isFinal: Boolean) -> Unit)? = null
  override var onError: ((error: String) -> Unit)? = null
  override var onPermissionDenied: (() -> Unit)? = null

  @DoNotStrip
  @Keep
  override fun startListening(params: Params) {
    Log.d(TAG, "startListening: ${params.toString()}")
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
      config = params
      start(context)
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
    mainHandler.postDelayed({
      try {
        speechRecognizer?.destroy()
        speechRecognizer = null
        Log.d(TAG, "destroy called")
      } catch (e: Exception) {
        onError?.invoke(e.message ?: "Unknown error at destroy")
      }
    }, 100)
  }

  private fun start(context: Context) {
    resultBatches = null
    mainHandler.post {
      try {
        if (speechRecognizer == null) {
          if (config?.recognizeOnDevice == true && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && SpeechRecognizer.isOnDeviceRecognitionAvailable(context)) {
            speechRecognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(context)
          } else {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context)
          }
          speechRecognizer?.setRecognitionListener(createRecognitionListener())
        }

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, config?.locale ?: "en-US")
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        // set 60s to avoid cutting early
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, config?.autoFinishRecognitionMs ?: 60000)

        if (config?.maskOffensiveWords != true && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          intent.putExtra(RecognizerIntent.EXTRA_MASK_OFFENSIVE_WORDS, false)
        }

        speechRecognizer?.startListening(intent)
      } catch (e: Exception) {
        onError?.invoke(e.message ?: "Unknown error")
      }
    }
    mainHandler.postDelayed({
      onReadyForSpeech?.invoke()
    }, 500)
  }

  private fun createRecognitionListener(): RecognitionListener {
    return object : RecognitionListener {
      override fun onReadyForSpeech(params: Bundle?) {}
      override fun onBeginningOfSpeech() {}
      override fun onRmsChanged(rmsdB: Float) {}
      override fun onBufferReceived(buffer: ByteArray?) {
        Log.d(TAG, "onEndOfSpeech")
      }
      override fun onEndOfSpeech() {
        Log.d(TAG, "onEndOfSpeech")
      }


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
        onEndOfSpeech?.invoke()
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
          Log.d(TAG, "onPartialResults[1], NO BATCHES YET | add first")
          currentBatches = arrayListOf(matches[0])
        } else {
          Log.d(TAG, "onPartialResults[1], current batches $currentBatches")
          val prevBatchLength = currentBatches[currentBatches.lastIndex].length
          val match = if (config?.disableRepeatingFilter == true) matches[0] else repeatingFilter(matches[0])
          val matchLength = match.length
          if (config?.disableBatchHandling == true || matchLength + 3 < prevBatchLength) {
            Log.d(TAG, "onPartialResults[2], append new batch")
            currentBatches.add(match)
          } else {
            Log.d(TAG, "onPartialResults[2], update batch, replace #${currentBatches.lastIndex}")
            currentBatches[currentBatches.lastIndex] = match
          }
        }
        resultBatches = currentBatches
        onResult?.invoke(currentBatches.toTypedArray(), false)
      }

      override fun onEvent(eventType: Int, params: Bundle?) {
        Log.d(TAG, "$eventType onEvent")
      }
    }
  }

  // Filters out 2 or more repeating words in a row, like "and and"
  private fun repeatingFilter(text: String): String {
    val words = text.split(Regex("\\s+")).toMutableList()
    var joiner = words[0]
    for (i in words.indices) {
      if (i == 0) continue
      if (words[i] == words[i-1]) continue
      joiner += " ${words[i]}"
    }
    return joiner
  }
}