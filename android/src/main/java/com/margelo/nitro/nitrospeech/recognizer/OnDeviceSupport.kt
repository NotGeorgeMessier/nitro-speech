package com.margelo.nitro.nitrospeech.recognizer

import android.annotation.SuppressLint
import android.app.Activity
import android.app.Application
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.ModelDownloadListener
import android.speech.RecognitionSupport
import android.speech.RecognitionSupportCallback
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.ReactApplicationContext
import com.margelo.nitro.nitrospeech.OnDeviceMode
import com.margelo.nitro.nitrospeech.SpeechRecognitionError
import com.margelo.nitro.nitrospeech.SupportedLocales
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.coroutines.resume
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.delay
import kotlinx.coroutines.suspendCancellableCoroutine

internal sealed class OnDevicePrepareResult {
  data object UseOnDevice : OnDevicePrepareResult()
  data object UseFallback : OnDevicePrepareResult()
  data class Failed(val error: SpeechRecognitionError) : OnDevicePrepareResult()
}

private enum class DownloadOutcome {
  SUCCESS,
  NOT_INSTALLED,
}

internal object OnDeviceSupport {
  private val mainHandler = Handler(Looper.getMainLooper())
  private val logger = Logger(disable = false)

  /** How long to wait for onSupportResult after a premature onError (OEM quirk). */
  private const val SUPPORT_ERROR_GRACE_MS = 250L
  private const val SUPPORT_QUERY_TIMEOUT_MS = 3_000L
  private const val DOWNLOAD_POLL_MS = 400L
  /** After host Activity resumes (dialog dismissed), re-check before treating as cancel. */
  private const val RESUME_SETTLE_MS = 600L
  /**
   * If the download UI never pauses the host Activity, abandon quickly.
   * (Manual Voice Input Settings fallback disabled for now — may return later behind a prewarm flag.)
   */
  private const val NO_DIALOG_TIMEOUT_MS = 2_500L
  /** Cap wait after user accepts download (pending → installed). */
  private const val DOWNLOAD_MAX_WAIT_MS = 120_000L
  /** Keep the download recognizer alive briefly — destroy can kill API 33 UI. */
  private const val RECOGNIZER_DESTROY_DELAY_MS = 1_500L

  fun isServiceAvailable(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      return false
    }
    return SpeechRecognizer.isOnDeviceRecognitionAvailable(context)
  }

  fun createRecognizer(context: Context, useOnDevice: Boolean): SpeechRecognizer {
    if (useOnDevice && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      return SpeechRecognizer.createOnDeviceSpeechRecognizer(context)
    }
    return SpeechRecognizer.createSpeechRecognizer(context)
  }

  suspend fun getSupportedLocales(context: Context): SupportedLocales {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU || !isServiceAvailable(context)) {
      return SupportedLocales(emptyArray(), emptyArray())
    }
    return querySupport(context).toSupportedLocales()
  }

  /**
   * Ensures on-device recognition is usable for [locale].
   * Downloads the locale model when missing (may show a system dialog on Android 13+).
   */
  suspend fun prepare(
    context: Context,
    locale: String,
    mode: OnDeviceMode,
  ): OnDevicePrepareResult {
    if (!isServiceAvailable(context)) {
      return if (mode == OnDeviceMode.REQUIRE) {
        OnDevicePrepareResult.Failed(SpeechRecognitionError.ONDEVICENOTSUPPORTED)
      } else {
        OnDevicePrepareResult.UseFallback
      }
    }

    // API 31–32: on-device service exists, but checkRecognitionSupport / triggerModelDownload
    // need API 33. Use the on-device recognizer anyway — we just can't verify/install packs.
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      logger.log("onDevice service available on API <33 — using on-device without pack checks")
      return OnDevicePrepareResult.UseOnDevice
    }

    var support = querySupport(context)
    if (isLocaleListed(support.installed, locale)) {
      return OnDevicePrepareResult.UseOnDevice
    }

    // Always attempt download when not installed. Do not trust support-list membership —
    // OEM locale tags often mismatch (en-US vs en_US vs en), which previously skipped the
    // download UI and immediately returned OnDeviceModelNotInstalled (API 33).
    logger.log(
      "onDevice model missing for $locale — triggering download " +
        "(installed=${support.installed.size}, supported=${support.supported.size}, pending=${support.pending.size})",
    )
    val outcome = downloadModel(context, locale)

    support = querySupport(context)
    if (outcome == DownloadOutcome.SUCCESS || isLocaleListed(support.installed, locale)) {
      return OnDevicePrepareResult.UseOnDevice
    }

    logger.log("onDevice download finished without install (outcome=$outcome)")
    return if (mode == OnDeviceMode.REQUIRE) {
      OnDevicePrepareResult.Failed(SpeechRecognitionError.ONDEVICEMODELNOTINSTALLED)
    } else {
      OnDevicePrepareResult.UseFallback
    }
  }

  private fun normalizeLocale(locale: String): String {
    return locale.replace('_', '-')
  }

  private fun isLocaleListed(locales: List<String>, locale: String): Boolean {
    val target = normalizeLocale(locale)
    return locales.any { normalizeLocale(it).equals(target, ignoreCase = true) }
  }

  private fun resolveActivity(context: Context): Activity? {
    return when (context) {
      is Activity -> context
      is ReactApplicationContext -> context.currentActivity
      else -> null
    }
  }

  private data class SupportSnapshot(
    val installed: List<String>,
    val supported: List<String>,
    val pending: List<String>,
  ) {
    fun toSupportedLocales(): SupportedLocales {
      val locales = supported.union(installed).sorted().toTypedArray()
      return SupportedLocales(locales, installed.toTypedArray())
    }
  }

  @SuppressLint("NewApi")
  private suspend fun querySupport(context: Context): SupportSnapshot {
    return suspendCancellableCoroutine { cont ->
      mainHandler.post {
        var recognizer: SpeechRecognizer? = null
        try {
          recognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(context)
          val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(
              RecognizerIntent.EXTRA_LANGUAGE_MODEL,
              RecognizerIntent.LANGUAGE_MODEL_FREE_FORM,
            )
          }
          var settled = false
          var errorPosted = false
          val callbackToken = Any()

          fun settle(snapshot: SupportSnapshot) {
            if (settled) return
            settled = true
            mainHandler.removeCallbacksAndMessages(callbackToken)
            if (cont.isActive) {
              cont.resume(snapshot)
            }
            try {
              recognizer.destroy()
            } catch (_: Exception) {
            }
          }

          mainHandler.postDelayed({
            logger.log("checkRecognitionSupport timed out")
            settle(SupportSnapshot(emptyList(), emptyList(), emptyList()))
          }, callbackToken, SUPPORT_QUERY_TIMEOUT_MS)

          recognizer.checkRecognitionSupport(
            intent,
            Executors.newSingleThreadExecutor(),
            object : RecognitionSupportCallback {
              override fun onSupportResult(recognitionSupport: RecognitionSupport) {
                settle(
                  SupportSnapshot(
                    installed = recognitionSupport.installedOnDeviceLanguages,
                    supported = recognitionSupport.supportedOnDeviceLanguages
                      .union(recognitionSupport.installedOnDeviceLanguages)
                      .toList(),
                    pending = recognitionSupport.pendingOnDeviceLanguages,
                  ),
                )
              }

              override fun onError(error: Int) {
                logger.log("checkRecognitionSupport error: $error")
                if (settled || errorPosted) return
                errorPosted = true
                mainHandler.postDelayed({
                  settle(SupportSnapshot(emptyList(), emptyList(), emptyList()))
                }, callbackToken, SUPPORT_ERROR_GRACE_MS)
              }
            },
          )
        } catch (e: Exception) {
          logger.log("querySupport failed: ${e.message}")
          if (cont.isActive) {
            cont.resume(SupportSnapshot(emptyList(), emptyList(), emptyList()))
          }
          recognizer?.destroy()
        }
      }
    }
  }

  /**
   * Shows the system model-download UI and waits until:
   * - model is installed (success), or
   * - user cancels / defers (not installed), or
   * - timeout / no UI
   *
   * API 35 cancel often fires **no** [ModelDownloadListener] callback. We detect that by the
   * host Activity pausing (dialog shown) then resuming (dialog gone) without an installed model.
   *
   * API 33: [SpeechRecognizer.triggerModelDownload] frequently shows **no** UI (docs: "might").
   * In that case we return NOT_INSTALLED (prefer → fallback, require → error). Manual settings
   * install UI is disabled for now.
   */
  @SuppressLint("NewApi")
  private suspend fun downloadModel(context: Context, locale: String): DownloadOutcome {
    // Match expo / AOSP samples: language only. Extra LANGUAGE_MODEL has broken OEM UIs.
    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
      putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale)
    }

    val activity = resolveActivity(context)
    // Prefer ReactApplicationContext like expo — Activity context can no-op triggerModelDownload on API 33.
    val recognizerContext: Context =
      when (context) {
        is ReactApplicationContext -> context
        else -> context.applicationContext
      }
    val outcome = CompletableDeferred<DownloadOutcome>()
    val recognizerHolder = arrayOfNulls<SpeechRecognizer>(1)
    val hostPausedForDialog = AtomicBoolean(false)
    val hostResumedAfterDialog = AtomicBoolean(false)
    var sawPending = false

    fun complete(result: DownloadOutcome, reason: String) {
      if (outcome.isCompleted) return
      logger.log("model download complete: $result ($reason)")
      outcome.complete(result)
    }

    val lifecycleCallbacks =
      activity?.let { host ->
        object : Application.ActivityLifecycleCallbacks {
          override fun onActivityCreated(a: Activity, savedInstanceState: Bundle?) {}
          override fun onActivityStarted(a: Activity) {}
          override fun onActivityStopped(a: Activity) {}
          override fun onActivitySaveInstanceState(a: Activity, outState: Bundle) {}
          override fun onActivityDestroyed(a: Activity) {}

          override fun onActivityPaused(a: Activity) {
            if (a === host) {
              hostPausedForDialog.set(true)
              logger.log("host activity paused (download dialog)")
            }
          }

          override fun onActivityResumed(a: Activity) {
            if (a === host && hostPausedForDialog.get()) {
              hostResumedAfterDialog.set(true)
              logger.log("host activity resumed after download dialog")
            }
          }
        }
      }

    if (activity != null && lifecycleCallbacks != null) {
      activity.application.registerActivityLifecycleCallbacks(lifecycleCallbacks)
    }

    try {
      suspendCancellableCoroutine { cont ->
        mainHandler.post {
          try {
            val recognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(recognizerContext)
            recognizerHolder[0] = recognizer

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
              recognizer.triggerModelDownload(
                intent,
                recognizerContext.mainExecutor,
                object : ModelDownloadListener {
                  override fun onProgress(progress: Int) {
                    logger.log("model download progress=$progress")
                  }

                  override fun onSuccess() {
                    complete(DownloadOutcome.SUCCESS, "listener.onSuccess")
                  }

                  override fun onScheduled() {
                    complete(DownloadOutcome.NOT_INSTALLED, "listener.onScheduled")
                  }

                  override fun onError(error: Int) {
                    complete(DownloadOutcome.NOT_INSTALLED, "listener.onError=$error")
                  }
                },
              )
            } else {
              // API 33 — fire-and-forget (same as expo). Do not destroy immediately.
              logger.log("triggerModelDownload(api33) locale=$locale")
              recognizer.triggerModelDownload(intent)
            }
          } catch (e: Exception) {
            logger.log("triggerModelDownload failed: ${e.message}")
            complete(DownloadOutcome.NOT_INSTALLED, "trigger failed")
          }
          if (cont.isActive) cont.resume(Unit)
        }
      }

      val startedAt = System.currentTimeMillis()
      // Do NOT call querySupport while waiting for the first UI —
      // another on-device SpeechRecognizer can suppress API 33 download UI.
      while (!outcome.isCompleted && System.currentTimeMillis() - startedAt < DOWNLOAD_MAX_WAIT_MS) {
        val elapsed = System.currentTimeMillis() - startedAt

        if (hostResumedAfterDialog.get()) {
          delay(RESUME_SETTLE_MS)
          if (outcome.isCompleted) break
          val again = querySupport(context)
          when {
            isLocaleListed(again.installed, locale) -> {
              complete(DownloadOutcome.SUCCESS, "poll.afterResume.installed")
            }
            isLocaleListed(again.pending, locale) -> {
              sawPending = true
              hostResumedAfterDialog.set(false)
              logger.log("model download pending after dialog — waiting")
            }
            else -> {
              complete(DownloadOutcome.NOT_INSTALLED, "poll.afterResume.canceled")
            }
          }
        } else if (sawPending) {
          val support = querySupport(context)
          when {
            isLocaleListed(support.installed, locale) ->
              complete(DownloadOutcome.SUCCESS, "poll.pending.installed")
            !isLocaleListed(support.pending, locale) ->
              complete(DownloadOutcome.NOT_INSTALLED, "poll.leftPending")
          }
        } else if (
          !hostPausedForDialog.get() &&
          elapsed >= NO_DIALOG_TIMEOUT_MS
        ) {
          // No download UI appeared — prefer will fallback, require will error.
          val support = querySupport(context)
          when {
            isLocaleListed(support.installed, locale) ->
              complete(DownloadOutcome.SUCCESS, "noDialog.alreadyInstalled")
            isLocaleListed(support.pending, locale) ->
              sawPending = true
            else ->
              complete(DownloadOutcome.NOT_INSTALLED, "noDialog")
          }
        }

        delay(DOWNLOAD_POLL_MS)
      }

      if (!outcome.isCompleted) {
        complete(DownloadOutcome.NOT_INSTALLED, "timeout")
      }
      return outcome.await()
    } finally {
      if (activity != null && lifecycleCallbacks != null) {
        try {
          activity.application.unregisterActivityLifecycleCallbacks(lifecycleCallbacks)
        } catch (_: Exception) {
        }
      }
      // Delay destroy: immediate destroy can cancel in-flight API 33 download UI.
      mainHandler.postDelayed({
        try {
          recognizerHolder[0]?.destroy()
        } catch (_: Exception) {
        }
      }, RECOGNIZER_DESTROY_DELAY_MS)
    }
  }
}
