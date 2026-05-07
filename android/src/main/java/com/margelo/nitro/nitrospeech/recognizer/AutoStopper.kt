package com.margelo.nitro.nitrospeech.recognizer

import android.os.Handler
import android.os.Looper
import kotlin.math.max

class AutoStopper(
    silenceThresholdMs: Double?,
    progressIntervalMs: Double?,
    private val onProgress: (Double) -> Unit,
    val onTimeout: () -> Unit,
) {
    companion object {
        private const val DEFAULT_SILENCE_THRESHOLD_MS = 8000.0
        private const val DEFAULT_PROGRESS_INTERVAL_MS = 1000.0
        private const val MIN_PROGRESS_INTERVAL_MS = 50.0
    }

    private val logger = Logger(disable = false)

    private var silenceThresholdMs: Double = clampMs(silenceThresholdMs ?: DEFAULT_SILENCE_THRESHOLD_MS)
    private var progressIntervalMs: Double = clampMs(progressIntervalMs ?: DEFAULT_PROGRESS_INTERVAL_MS)

    private var timeLeftMs: Double = this.silenceThresholdMs
    private var isStopped = false
    private var didTimeout = false
    private var isTimerScheduled = false

    private val handler = Handler(Looper.getMainLooper())

    private val tickRunnable = Runnable { tick() }

    fun resetTimer() {
        logger.log("resetTimer | isStopped: $isStopped | ms: ${System.currentTimeMillis()}")
        handler.removeCallbacks(tickRunnable)
        isTimerScheduled = false
        if (isStopped) return
        didTimeout = false
        timeLeftMs = silenceThresholdMs
        if (timeLeftMs > 0) {
            onProgress(timeLeftMs)
        }
        scheduleNextTickLocked()
    }

    fun stop() {
        isStopped = true
        handler.removeCallbacks(tickRunnable)
        isTimerScheduled = false
    }

    fun updateSilenceThreshold(newThresholdMs: Double) {
        silenceThresholdMs = clampMs(newThresholdMs)
    }

    fun addMsOnce(extraMs: Double) {
        if (isStopped || !extraMs.isFinite()) return
        logger.log("addMsOnce | extraMs: $extraMs")
        timeLeftMs += extraMs
        didTimeout = false
        if (timeLeftMs > 0 && isTimerScheduled) {
            onProgress(timeLeftMs)
        }
    }

    fun updateProgressInterval(newIntervalMs: Double) {
        if (isStopped) return
        logger.log("updateProgressInterval | newIntervalMs: $newIntervalMs")
        progressIntervalMs = clampMs(newIntervalMs)
        if (isTimerScheduled) {
            scheduleNextTickLocked()
        }
    }

    private fun scheduleNextTickLocked() {
        handler.removeCallbacks(tickRunnable)
        val delayMs = progressIntervalMs.toLong().coerceAtLeast(MIN_PROGRESS_INTERVAL_MS.toLong())
        handler.postDelayed(tickRunnable, delayMs)
        isTimerScheduled = true
    }

    private fun tick() {
        if (isStopped || didTimeout) return
        timeLeftMs -= progressIntervalMs
        if (timeLeftMs > 0) {
            logger.log("onProgress | timeLeftMs: $timeLeftMs")
            onProgress(timeLeftMs)
            scheduleNextTickLocked()
            return
        }
        timeLeftMs = 0.0
        didTimeout = true
        handler.removeCallbacks(tickRunnable)
        isTimerScheduled = false
        logger.log("onTimeout | ms: ${System.currentTimeMillis()}")
        onTimeout()
    }

    private fun clampMs(value: Double): Double {
        if (!value.isFinite()) return MIN_PROGRESS_INTERVAL_MS
        return max(MIN_PROGRESS_INTERVAL_MS, value)
    }
}
