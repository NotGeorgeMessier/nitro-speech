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
import com.margelo.nitro.nitrospeech.Params

class HybridRecognizer: HybridRecognizerSpec() {
  companion object {
    private const val TAG = "HybridRecognizer"
    private const val POST_RECOGNITION_DELAY = 250L
  }

  private var isActive: Boolean = false
  private var config: Params? = null
  private var autoStopper: AutoStopper? = null
  private var speechRecognizer: SpeechRecognizer? = null
  private val mainHandler = Handler(Looper.getMainLooper())

  override var onReadyForSpeech: (() -> Unit)? = null
  override var onRecordingStopped: (() -> Unit)? = null
  override var onResult: ((resultBatches: Array<String>) -> Unit)? = null
  override var onError: ((error: String) -> Unit)? = null
  override var onPermissionDenied: (() -> Unit)? = null

  @DoNotStrip
  @Keep
  override fun startListening(params: Params) {
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
    autoStopper?.stop()
    onFinishRecognition(null, null, true)
    stop()
  }


  @DoNotStrip
  @Keep
  override fun destroy() {
    autoStopper?.stop()
    autoStopper = null
    onFinishRecognition(null, null, true)
    destroyRecognizer()
  }

  private fun start(context: Context) {
    mainHandler.post {
      try {
        if (config?.recognizeOnDevice == true && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && SpeechRecognizer.isOnDeviceRecognitionAvailable(context)) {
          speechRecognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(context)
        } else {
          speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context)
        }
        val silenceThreshold = config?.autoFinishRecognitionMs?.toLong() ?: 8000
        autoStopper = AutoStopper(
            silenceThreshold,
        ) {
            onRecordingStopped?.invoke()
            stop()
            destroyRecognizer()
        }
        val recognitionListenerSession = RecognitionListenerSession(
          autoStopper,
          config,
        ) { result: ArrayList<String>?, errorMessage: String?, recordingStopped: Boolean ->
          onFinishRecognition(result, errorMessage, recordingStopped)
        }
        speechRecognizer?.setRecognitionListener(recognitionListenerSession.createRecognitionListener())

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, config?.locale ?: "en-US")
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        // set 60s to avoid cutting early
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 60000)

        if (config?.androidMaskOffensiveWords != true && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          intent.putExtra(RecognizerIntent.EXTRA_MASK_OFFENSIVE_WORDS, false)
        }

        speechRecognizer?.startListening(intent)
        isActive = true
        mainHandler.postDelayed({
          if (isActive) {
            onReadyForSpeech?.invoke()
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

  private fun stop() {
    mainHandler.postDelayed({
      try {
        speechRecognizer?.stopListening()
        Log.d(TAG, "stopListening called")
        isActive = false
      } catch (e: Exception) {
        onFinishRecognition(
          null,
          "Error at stopListening.mainHandler.postDelayed: ${e.message ?: "Unknown error"}",
          true
        )
      }
    }, POST_RECOGNITION_DELAY)
  }

  private fun destroyRecognizer() {
    mainHandler.postDelayed({
      try {
        speechRecognizer?.destroy()
        speechRecognizer = null
        Log.d(TAG, "destroy called")
        isActive = false
      } catch (e: Exception) {
        onFinishRecognition(
          null,
          "Error at destroy.mainHandler.postDelayed: ${e.message ?: "Unknown error"}",
          true
        )
      }
    }, POST_RECOGNITION_DELAY)
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