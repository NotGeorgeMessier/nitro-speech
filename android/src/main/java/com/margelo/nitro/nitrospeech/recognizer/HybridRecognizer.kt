package com.margelo.nitro.nitrospeech.recognizer

import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.speech.RecognizerIntent
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import com.margelo.nitro.nitrospeech.MutableSpeechRecognitionConfig
import com.margelo.nitro.nitrospeech.HybridRecognizerSpec
import com.margelo.nitro.nitrospeech.PermissionStatus
import com.margelo.nitro.nitrospeech.SpeechRecognitionConfig
import com.margelo.nitro.nitrospeech.SpeechRecognitionError
import com.margelo.nitro.nitrospeech.SpeechRecognitionPrewarm
import com.margelo.nitro.nitrospeech.SupportedLocales
import com.margelo.nitro.nitrospeech.VolumeChangeEvent

@DoNotStrip
@Keep
class HybridRecognizer: HybridRecognizerSpec() {
  companion object {
    private const val POST_RECOGNITION_DELAY = 250L
    private const val DEFAULT_LOCALE = "en-US"
  }

  private val logger = Logger(disable = false)

  private var isActive: Boolean = false
  private var config: SpeechRecognitionConfig? = null
  private var volumeChangeEvent: VolumeChangeEvent = VolumeChangeEvent(0.0,0.0,null)
  private var autoStopper: AutoStopper? = null
  private var speechRecognizer: android.speech.SpeechRecognizer? = null
  private val mainHandler = Handler(Looper.getMainLooper())

  override var onReadyForSpeech: (() -> Unit)? = null
  override var onRecordingStopped: (() -> Unit)? = null
  override var onResult: ((resultBatches: Array<String>) -> Unit)? = null

  override var onAutoFinishProgress: ((timeLeftMs: Double) -> Unit)? = null
  override var onError: ((error: SpeechRecognitionError) -> Unit)? = null
  override var onPermissionDenied: (() -> Unit)? = null
  override var onVolumeChange: ((event: VolumeChangeEvent) -> Unit)? = null

  @DoNotStrip
  @Keep
  override fun prewarm(
    defaultParams: SpeechRecognitionConfig?,
    options: SpeechRecognitionPrewarm?
  ): Promise<Unit> {
    logger.log("prewarm called")
    return Promise.async {
      if (defaultParams != null) {
        config = defaultParams
      }
      // Enabled by default for user
      if (options?.requestPermission != false) {
        preparePermissions(null, isPrewarm = true)
      }
      val context = NitroModules.applicationContext ?: return@async
      val onDevice = config?.onDevice ?: return@async
      when (
        val result = OnDeviceSupport.prepare(
          context = context,
          locale = config?.locale ?: DEFAULT_LOCALE,
          mode = onDevice,
        )
      ) {
        is OnDevicePrepareResult.Failed -> {
          // Mirror startListening require failures (e.g. cancel download).
          onError?.invoke(result.error)
        }
        OnDevicePrepareResult.UseOnDevice,
        OnDevicePrepareResult.UseFallback -> Unit
      }
    }
  }

  @DoNotStrip
  @Keep
  override fun startListening(params: SpeechRecognitionConfig?) {
    logger.log("startListening: $params")
    Promise.async {
      preparePermissions(params, isPrewarm = false)
    }
  }

  @DoNotStrip
  @Keep
  override fun stopListening() {
    logger.log("stopListening called")
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
    logger.log("addAutoFinishTime")
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
    newConfig: MutableSpeechRecognitionConfig?,
    resetAutoFinishTime: Boolean?
  ) {
    logger.log("updateConfig $newConfig")
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
      config = SpeechRecognitionConfig(
        locale = config?.locale,
        contextualStrings = config?.contextualStrings,
        maskOffensiveWords = config?.maskOffensiveWords,
        onDevice = config?.onDevice,
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
  override fun getVoiceInputVolume(): VolumeChangeEvent {
    return volumeChangeEvent
  }

  @DoNotStrip
  @Keep
  override fun getPermissions(): PermissionStatus {
    val context = NitroModules.applicationContext ?: return PermissionStatus.NOT_REQUESTED
    val activity = context.currentActivity ?: return PermissionStatus.NOT_REQUESTED
    return AudioPermissionRequester.checkStatus(activity)
  }

  @DoNotStrip
  @Keep
  override fun getSupportedLocales(): Promise<SupportedLocales> {
    return Promise.async {
      val context = NitroModules.applicationContext
        ?: return@async SupportedLocales(emptyArray(), emptyArray())
      OnDeviceSupport.getSupportedLocales(context)
    }
  }

  @DoNotStrip
  @Keep
  override fun getSupportedLocalesIOS(): Array<String> {
    return emptyArray()
  }

  @DoNotStrip
  @Keep
  override fun onDeviceRecognitionAvailable(locale: String?): Boolean {
    val context = NitroModules.applicationContext ?: return false
    return OnDeviceSupport.isServiceAvailable(context)
  }

  @DoNotStrip
  @Keep
  override fun dispose() {
    stopListening()
  }

  private suspend fun preparePermissions(params: SpeechRecognitionConfig?, isPrewarm: Boolean) {
    if (isActive) {
      // Ignore prepare if active
      return
    }

    val context = NitroModules.applicationContext
    if (context == null) {
      if (isPrewarm) {
        // Do not report error for prepare
        return
      }
      onFinishRecognition(
        null,
        SpeechRecognitionError.SESSIONSTARTFAILED,
        true
      )
      return
    }
    val activity = context.currentActivity
    if (activity == null) {
      if (isPrewarm) {
        // Do not report error for prepare
        return
      }
      onFinishRecognition(
        null,
        SpeechRecognitionError.SESSIONSTARTFAILED,
        true
      )
      return
    }

    val permissionRequester = AudioPermissionRequester(activity)
    val granted = permissionRequester.checkAndRequest()
    if (!granted) {
      onPermissionDenied?.invoke()
      return
    }
    if (isPrewarm) {
      return
    }
    config = params
    val useOnDevice = resolveUseOnDevice(context)
    if (useOnDevice == null) {
      // Fatal on-device error already reported
      return
    }
    start(context, useOnDevice)
  }

  /**
   * @return true = on-device, false = network/default, null = aborted with error
   */
  private suspend fun resolveUseOnDevice(context: Context): Boolean? {
    val mode = config?.onDevice ?: return false
    return when (
      val result = OnDeviceSupport.prepare(
        context = context,
        locale = config?.locale ?: DEFAULT_LOCALE,
        mode = mode,
      )
    ) {
      OnDevicePrepareResult.UseOnDevice -> true
      OnDevicePrepareResult.UseFallback -> false
      is OnDevicePrepareResult.Failed -> {
        onFinishRecognition(null, result.error, true)
        null
      }
    }
  }

  private fun start(context: Context, useOnDevice: Boolean) {
    mainHandler.post {
      try {
        speechRecognizer = OnDeviceSupport.createRecognizer(context, useOnDevice)
        logger.log("start useOnDevice=$useOnDevice")
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
            fireVolumeChangeEvent = { event -> fireVolumeChangeEvent(event) },
            onFinishRecognition = { result, error, recordingStopped ->
              onFinishRecognition(result, error, recordingStopped)
            }
        )

        speechRecognizer?.setRecognitionListener(recognitionListenerSession.createRecognitionListener())

        val languageModel = if (config?.androidUseWebSearchModel == true) RecognizerIntent.LANGUAGE_MODEL_WEB_SEARCH else RecognizerIntent.LANGUAGE_MODEL_FREE_FORM

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, languageModel)
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, config?.locale ?: DEFAULT_LOCALE)
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
        
        val hapticStyle = config?.startHapticFeedbackStyle

        HapticImpact(hapticStyle).trigger(context)
        mainHandler.postDelayed({
          if (isActive) {
            onReadyForSpeech?.invoke()
            onFinishRecognition(arrayListOf(), null, false)
            autoStopper?.resetTimer()
          }
        }, 500)
      } catch (_: Exception) {
        onFinishRecognition(
          null,
          SpeechRecognitionError.SESSIONSTARTFAILED,
          true
        )
      }
    }
  }

  private fun cleanup() {
    isActive = false
    try {
      logger.log("cleanup called")
      autoStopper?.stop()
      autoStopper = null
      speechRecognizer?.stopListening()
      speechRecognizer?.destroy()
      speechRecognizer = null
      // Reset voice meter in JS consumers after stop/error cleanup.
      fireVolumeChangeEvent(VolumeChangeEvent(0.0,0.0,null))
    } catch (_: Exception) {
      speechRecognizer = null
      onFinishRecognition(
        null,
        SpeechRecognitionError.UNKNOWN,
        true
      )
    }
  }

  private fun onFinishRecognition(
    result: ArrayList<String>?,
    error: SpeechRecognitionError?,
    recordingStopped: Boolean
  ) {
    if (recordingStopped) {
      onRecordingStopped?.invoke()
    }
    if (error != null) {
      onError?.invoke(error)
    }
    if (!result.isNullOrEmpty()) {
      onResult?.invoke(result.toTypedArray())
    }
  }

  private fun fireVolumeChangeEvent(event: VolumeChangeEvent) {
    logger.log("fireVolumeChangeEvent $event")
    volumeChangeEvent = event
    onVolumeChange?.invoke(event)
  }
}
