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
import com.margelo.nitro.core.Promise
import com.margelo.nitro.nitrospeech.DynamicParams
import com.margelo.nitro.nitrospeech.HybridRecognizerSpec
import com.margelo.nitro.nitrospeech.SpeechToTextParams
import com.margelo.nitro.nitrospeech.VolumeChangeEvent

@DoNotStrip
@Keep
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
  override var onVolumeChange: ((event: VolumeChangeEvent) -> Unit)? = null

  @DoNotStrip
  @Keep
  override fun prewarm(defaultParams: SpeechToTextParams?): Promise<Unit> {
    // no-op
    // nothing to prewarm
    return Promise()
  }

  @DoNotStrip
  @Keep
  override fun startListening(params: SpeechToTextParams?) {
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
      val context = NitroModules.applicationContext
      val hapticImpact = config?.stopHapticFeedbackStyle
      if (context != null) {
        HapticImpact(hapticImpact).trigger(context)
      }
      cleanup()
    }, POST_RECOGNITION_DELAY)
  }

  @DoNotStrip
  @Keep
  override fun resetAutoFinishTime() {
    if (!isActive) return
    autoStopper?.resetTimer()
  }

  @DoNotStrip
  @Keep
  override fun addAutoFinishTime(additionalTimeMs: Double?) {
    Log.d(TAG, "addAutoFinishTime")
    if (!isActive) return

    if (additionalTimeMs != null) {
      autoStopper?.addMsOnce(additionalTimeMs)
    } else {
      // Reset timer to original baseline.
      autoStopper?.resetTimer()
    }
  }

  @DoNotStrip
  @Keep
  override fun updateConfig(
    newConfig: DynamicParams?,
    resetAutoFinishTime: Boolean?
  ) {
    Log.d(TAG, "updateConfig $newConfig",)
    if (!isActive) return

    val newTimeMs = if (newConfig?.autoFinishRecognitionMs != null) newConfig.autoFinishRecognitionMs else config?.autoFinishRecognitionMs
    if (newTimeMs != null && newTimeMs != config?.autoFinishRecognitionMs) {
      autoStopper?.updateSilenceThreshold(newTimeMs)
    }
    val newInterval = if (newConfig?.autoFinishProgressIntervalMs != null) newConfig.autoFinishProgressIntervalMs else config?.autoFinishProgressIntervalMs
    if (newInterval != null && newInterval != config?.autoFinishProgressIntervalMs) {
      autoStopper?.updateProgressInterval(newInterval)
    }

    if (resetAutoFinishTime == true) {
      autoStopper?.resetTimer()
    }

    if (newConfig != null) {
      config = SpeechToTextParams(
        locale = config?.locale,
        contextualStrings = config?.contextualStrings,
        maskOffensiveWords = config?.maskOffensiveWords,
        autoFinishRecognitionMs = newConfig.autoFinishRecognitionMs ?: config?.autoFinishRecognitionMs,
        autoFinishProgressIntervalMs = newConfig.autoFinishProgressIntervalMs ?: config?.autoFinishProgressIntervalMs,
        resetAutoFinishVoiceSensitivity = newConfig.resetAutoFinishVoiceSensitivity ?: config?.resetAutoFinishVoiceSensitivity,
        disableRepeatingFilter = newConfig.disableRepeatingFilter ?: config?.disableRepeatingFilter,
        startHapticFeedbackStyle = newConfig.startHapticFeedbackStyle ?: config?.startHapticFeedbackStyle,
        stopHapticFeedbackStyle = newConfig.stopHapticFeedbackStyle ?: config?.stopHapticFeedbackStyle,
        androidFormattingPreferQuality = config?.androidFormattingPreferQuality,
        androidUseWebSearchModel = config?.androidUseWebSearchModel,
        androidDisableBatchHandling = config?.androidDisableBatchHandling,
        iosAddPunctuation = config?.iosAddPunctuation,
        iosPreset = config?.iosPreset,
        iosAtypicalSpeech = config?.iosAtypicalSpeech
      )
    }
  }

  @DoNotStrip
  @Keep
  override fun getIsActive(): Boolean {
    return isActive
  }

  @DoNotStrip
  @Keep
  override fun getSupportedLocalesIOS(): Array<String> {
    return emptyArray()
  }

  @DoNotStrip
  @Keep
  override fun dispose() {
    stopListening()
  }

  private fun start(context: Context) {
    mainHandler.post {
      try {
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context)
        autoStopper = AutoStopper(
            silenceThresholdMs = config?.autoFinishRecognitionMs,
            progressIntervalMs = config?.autoFinishProgressIntervalMs,
            onProgress = { timeLeftMs ->
              onAutoFinishProgress?.invoke(timeLeftMs)
            },
            onTimeout = {
              stopListening()
            }
        )
        val recognitionListenerSession = RecognitionListenerSession(
          autoStopper,
          config,
          onVolumeChange
        ) { result: ArrayList<String>?, errorMessage: String?, recordingStopped: Boolean ->
          onFinishRecognition(result, errorMessage, recordingStopped)
        }
        speechRecognizer?.setRecognitionListener(recognitionListenerSession.createRecognitionListener())

        val languageModel = if (config?.androidUseWebSearchModel == true) RecognizerIntent.LANGUAGE_MODEL_WEB_SEARCH else RecognizerIntent.LANGUAGE_MODEL_FREE_FORM

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, languageModel)
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, config?.locale ?: "en-US")
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        // Set a lot of time to avoid cutting early
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 300000)

        if (config?.maskOffensiveWords != true && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
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
        
        val hapticImpact = config?.startHapticFeedbackStyle

        HapticImpact(hapticImpact).trigger(context)
        mainHandler.postDelayed({
          if (isActive) {
            onReadyForSpeech?.invoke()
            onFinishRecognition(arrayListOf(), null, false)
            autoStopper?.resetTimer()
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
      Log.d(TAG, "cleanup called")
      autoStopper?.stop()
      autoStopper = null
      speechRecognizer?.stopListening()
      speechRecognizer?.destroy()
      speechRecognizer = null
      isActive = false
      // Reset voice meter in JS consumers after stop/error cleanup.
      onVolumeChange?.invoke(VolumeChangeEvent(0.0,0.0,null))
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