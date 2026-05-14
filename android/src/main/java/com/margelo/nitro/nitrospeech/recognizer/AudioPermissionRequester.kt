package com.margelo.nitro.nitrospeech.recognizer

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class AudioPermissionRequester (
  private val activity: Activity
) {
  private val recordAudioPermission = Manifest.permission.RECORD_AUDIO
  private val componentActivity = activity as? ComponentActivity ?: error("Host activity must be a ComponentActivity")

  private var callback: ((Boolean) -> Unit)? = null

  private val launcher = componentActivity.activityResultRegistry.register(
    "record_audio_key",
    ActivityResultContracts.RequestPermission()
  ) { granted ->
    callback?.invoke(granted)
  }

  suspend fun checkAndRequest(): Boolean {
    val audioGranted =
      ContextCompat.checkSelfPermission(
        activity,
        recordAudioPermission
      ) == PackageManager.PERMISSION_GRANTED

    if (audioGranted) {
      return true
    }

    return suspendCancellableCoroutine { cont ->
      callback = { granted ->
        if (cont.isActive) cont.resume(granted)
      }
      launcher.launch(recordAudioPermission)
    }
  }
}