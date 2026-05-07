package com.margelo.nitro.nitrospeech.recognizer

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
    Log.d(TAG, message)
  }
}