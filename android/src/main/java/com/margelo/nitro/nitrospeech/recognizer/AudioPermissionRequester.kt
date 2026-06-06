package com.margelo.nitro.nitrospeech.recognizer

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.margelo.nitro.nitrospeech.PermissionStatus
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import androidx.core.content.edit

class AudioPermissionRequester(
  private val activity: Activity
) {
  private val recordAudioPermission = Manifest.permission.RECORD_AUDIO
  private val componentActivity = activity as? ComponentActivity ?: error("Host activity must be a ComponentActivity")

  private val prefs = activity.getSharedPreferences(Companion.PREFS_NAME, android.content.Context.MODE_PRIVATE)

  private var callback: ((Boolean) -> Unit)? = null

  private val launcher = componentActivity.activityResultRegistry.register(
    "record_audio_key",
    ActivityResultContracts.RequestPermission()
  ) { granted ->
    callback?.invoke(granted)
  }

  private fun hasRequested(): Boolean = prefs.getBoolean(Companion.REQUESTED_KEY, false)

  private fun markRequested() {
    prefs.edit { putBoolean(Companion.REQUESTED_KEY, true) }
  }

  fun check(): Boolean = checkStatus() == PermissionStatus.GRANTED

  fun checkStatus(): PermissionStatus = Companion.checkStatus(activity)

  suspend fun checkAndRequest(): Boolean {
    if (check()) {
      return true
    }

    if (!hasRequested()) {
      markRequested()
    }

    return suspendCancellableCoroutine { cont ->
      callback = { granted ->
        if (cont.isActive) cont.resume(granted)
      }
      launcher.launch(recordAudioPermission)
    }
  }

  companion object {
    const val PREFS_NAME = "nitro_speech_prefs"
    const val REQUESTED_KEY = "audio_permission_requested"

    fun checkStatus(activity: Activity): PermissionStatus {
      val prefs = activity.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE)
      val hasRequested = prefs.getBoolean(REQUESTED_KEY, false)
      val granted = ContextCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
      return when {
        granted -> PermissionStatus.GRANTED
        hasRequested -> PermissionStatus.DENIED
        else -> PermissionStatus.NOT_REQUESTED
      }
    }
  }
}