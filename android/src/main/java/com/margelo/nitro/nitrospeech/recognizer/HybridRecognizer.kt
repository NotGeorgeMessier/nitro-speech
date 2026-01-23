package com.margelo.nitro.nitrospeech.recognizer

import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules
import com.margelo.nitro.nitrospeech.HybridRecognizerSpec
import com.margelo.nitro.nitrospeech.SpeechToTextParams

class HybridRecognizer: HybridRecognizerSpec() {
  companion object {
    private const val TAG = "HybridRecognizer"
    private const val POST_RECOGNITION_DELAY = 250L
  }

  private var isActive: Boolean = false
  private var config: SpeechToTextParams? = null
  private var autoStopper: AutoStopper? = null
  private var speechRecognizer: SpeechRecognizer? = null
  private val mainHandler = Handler(Looper.getMainLooper())

  override var onReadyForSpeech: (() -> Unit)? = null
  override var onRecordingStopped: (() -> Unit)? = null
  override var onResult: ((resultBatches: Array<String>) -> Unit)? = null

  override var onAutoFinishProgress: ((timeLeftMs: Double) -> Unit)? = null
  override var onError: ((error: String) -> Unit)? = null
  override var onPermissionDenied: (() -> Unit)? = null

  @DoNotStrip
  @Keep
  override fun startListening(params: SpeechToTextParams) {
    Log.d(TAG, "startListening: $params")
    if (isActive) {
      onFinishRecognition(
        null,
        "Error at startListening: Previous SpeechRecognizer is still active",
        false
      )
      return
    }

    val context = NitroModules.applicationContext
    if (context == null) {
      onFinishRecognition(
        null,
        "Error at startListening: Context not available",
        true
      )
      return
    }
    val activity = context.currentActivity
    if (activity == null) {
      onFinishRecognition(
        null,
        "Error at startListening: Activity not found",
        true
      )
      return
    }

    val permissionRequester = AudioPermissionRequester(activity)
    permissionRequester.checkAndRequest { granted ->
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
    Log.d(TAG, "stopListening called")
    if (!isActive) return
    onFinishRecognition(null, null, true)
    mainHandler.postDelayed({
      cleanup()
    }, POST_RECOGNITION_DELAY)
  }

  override fun dispose() {
    stopListening()
  }

  private fun start(context: Context) {
    mainHandler.post {
      try {
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context)
        val silenceThreshold = config?.autoFinishRecognitionMs?.toLong() ?: 8000
        autoStopper = AutoStopper(
            silenceThreshold,
        ) {
            stopListening()
        }
        val recognitionListenerSession = RecognitionListenerSession(
          autoStopper,
          config,
        ) { result: ArrayList<String>?, errorMessage: String?, recordingStopped: Boolean ->
          onFinishRecognition(result, errorMessage, recordingStopped)
        }
        speechRecognizer?.setRecognitionListener(recognitionListenerSession.createRecognitionListener())

        val languageModel = if (config?.androidUseWebSearchModel == true) RecognizerIntent.LANGUAGE_MODEL_WEB_SEARCH else RecognizerIntent.LANGUAGE_MODEL_FREE_FORM

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, languageModel)
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, config?.locale ?: "en-US")
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        // set many secs to avoid cutting early
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 300000)

        if (config?.androidMaskOffensiveWords != true && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          intent.putExtra(RecognizerIntent.EXTRA_MASK_OFFENSIVE_WORDS, false)
        }

        if (config?.androidFormattingPreferQuality == true && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          intent.putExtra(RecognizerIntent.EXTRA_ENABLE_FORMATTING, RecognizerIntent.FORMATTING_OPTIMIZE_QUALITY)
        }

        val contextualStrings = config?.contextualStrings
        if (!contextualStrings.isNullOrEmpty() && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.putExtra(
                RecognizerIntent.EXTRA_BIASING_STRINGS,
                ArrayList(contextualStrings.toList()),
            )
        }

        speechRecognizer?.startListening(intent)
        isActive = true
        mainHandler.postDelayed({
          if (isActive) {
            onReadyForSpeech?.invoke()
            onFinishRecognition(arrayListOf(), null, false)
          }
        }, 500)
      } catch (e: Exception) {
        onFinishRecognition(
          null,
          "Error at start.mainHandler.post: ${e.message ?: "Unknown error"}",
          true
        )
      }
    }
  }

  private fun cleanup() {
    try {
      Log.d(TAG, "stopListening called")
      autoStopper?.stop()
      autoStopper = null
      speechRecognizer?.stopListening()
      speechRecognizer?.destroy()
      speechRecognizer = null
      isActive = false
    } catch (e: Exception) {
      onFinishRecognition(
        null,
        "Error at stopListening.mainHandler.postDelayed: ${e.message ?: "Unknown error"}",
        true
      )
    }
  }

  private fun onFinishRecognition(result: ArrayList<String>?, errorMessage: String?, recordingStopped: Boolean) {
    if (recordingStopped) {
      onRecordingStopped?.invoke()
    }
    if (!errorMessage.isNullOrEmpty()) {
      onError?.invoke(errorMessage)
    }
    if (!result.isNullOrEmpty()) {
      onResult?.invoke(result.toTypedArray())
    }
  }
}