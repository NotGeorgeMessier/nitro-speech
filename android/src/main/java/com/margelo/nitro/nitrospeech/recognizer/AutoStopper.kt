package com.margelo.nitro.nitrospeech.recognizer

import android.os.Handler
import android.os.Looper
import android.util.Log

class AutoStopper (
    private val silenceThreshold: Long,
    val forceStopRecording: () -> Unit,
) {
    companion object {
        private const val TAG = "HybridRecognizer"
    }

    private var isStopped = false
    private val handler = Handler(Looper.getMainLooper())

    private val autoStopRecording = Runnable {
        if (isStopped) return@Runnable
        Log.d(TAG, "forceStopRecording, ms: ${System.currentTimeMillis()}")
        forceStopRecording()
    }

    fun indicateRecordingActivity() {
        Log.d(TAG, "indicateRecordingActivity | isStopped: $isStopped | ms: ${System.currentTimeMillis()}")
        handler.removeCallbacks(autoStopRecording)
        if (isStopped) return
        handler.postDelayed(autoStopRecording, silenceThreshold)
    }

    fun stop() {
        isStopped = true
        handler.removeCallbacks(autoStopRecording)
    }
}