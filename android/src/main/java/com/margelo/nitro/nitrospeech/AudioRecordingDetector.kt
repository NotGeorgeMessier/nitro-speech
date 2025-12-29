package com.margelo.nitro.nitrospeech

import android.os.Handler
import android.os.Looper
import android.util.Log

class AudioRecordingDetector(
    private val onRecordingStopped: (() -> Unit)?
) {
    companion object {
        private const val SILENCE_THRESHOLD_MS = 800L
    }

    private val handler = Handler(Looper.getMainLooper())

    private val checkRunnable = Runnable {
        onRecordingStopped?.invoke()
    }

    fun indicateRmsChange() {
        handler.removeCallbacks(checkRunnable)
        handler.postDelayed(checkRunnable, SILENCE_THRESHOLD_MS)
    }

    fun stop() {
        handler.removeCallbacks(checkRunnable)
    }
}