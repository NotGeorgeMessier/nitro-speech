package com.margelo.nitro.nitrospeech.recognizer

import android.os.Looper
import android.util.Log

class Logger (
  private val disable: Boolean
) {
  private val isLogging = false
  companion object {
    private const val TAG = "HybridRecognizer"
  }
  fun log(message: String) {
    if (disable || !isLogging) return
    val tn = if (Looper.getMainLooper().isCurrentThread) "main" else "bg"
    Log.d(TAG, "[thread]: $tn | $message")
  }
}