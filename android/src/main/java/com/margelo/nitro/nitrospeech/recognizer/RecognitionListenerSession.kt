package com.margelo.nitro.nitrospeech.recognizer

import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.SpeechRecognizer
import android.util.Log
import com.margelo.nitro.nitrospeech.SpeechToTextParams
import kotlin.math.max
import kotlin.math.roundToInt

class RecognitionListenerSession (
    private val autoStopper: AutoStopper?,
    private val config: SpeechToTextParams?,
    private val onVolumeChange: ((normVolume: Double) -> Unit)?,
    private val onFinishRecognition: (result: ArrayList<String>?, errorMessage: String?, recordingStopped: Boolean) -> Unit,
) {
    companion object {
        private const val TAG = "HybridRecognizer"
        private const val SPEECH_LEVEL_THRESHOLD = 0.08f
        private const val FLOOR_RISE_ALPHA = 0.01f
        private const val FLOOR_FALL_ALPHA = 0.20f
        private const val PEAK_ATTACK_ALPHA = 0.25f
        private const val PEAK_DECAY_ALPHA = 0.01f
        private const val METER_ATTACK = 0.35f
        private const val METER_RELEASE = 0.08f
        private const val MIN_SPAN_DB = 6f
        private const val PRECISION_SCALE = 1_000_000f
    }

    private var resultBatches: ArrayList<String>? = null
    private var noiseFloorDb = Float.NaN
    private var peakDb = Float.NaN
    private var levelSmoothed = 0f

    fun createRecognitionListener(): RecognitionListener {
        resultBatches = null
        return object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {
                val normLevel = normalizeRmsDb(rmsdB)
                onVolumeChange?.invoke(normLevel.toDouble())
                if (normLevel > SPEECH_LEVEL_THRESHOLD) {
                    autoStopper?.indicateRecordingActivity()
                }
            }
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {}

            override fun onError(error: Int) {
                val message = when (error) {
                    SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
                    SpeechRecognizer.ERROR_CLIENT -> "Client side error"
                    SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
                    SpeechRecognizer.ERROR_NETWORK -> "Network error"
                    SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
                    SpeechRecognizer.ERROR_NO_MATCH -> "No match"
                    SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognizer busy"
                    SpeechRecognizer.ERROR_SERVER -> "Server error"
                    SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input"
                    else -> "Unknown error"
                }
                onFinishRecognition(
                    null,
                    "Error at RecognitionListener: $message",
                    true
                )
                autoStopper?.stop()
                autoStopper?.forceStopRecording()
            }

            override fun onResults(results: Bundle?) {
                Log.d(TAG, "onResults: $resultBatches")
                onFinishRecognition(resultBatches, null, true)
                autoStopper?.stop()
                autoStopper?.forceStopRecording()
            }

            override fun onPartialResults(partialResults: Bundle?) {
                autoStopper?.indicateRecordingActivity()
                val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)

                if (matches.isNullOrEmpty() || matches[0] == "") {
                    Log.d(TAG, "onPartialResults[0], skip, NO RECOGNIZE")
                    return
                }

                Log.d(TAG, "onPartialResults[0], add ${matches[0]}")
                var currentBatches = resultBatches
                if (currentBatches.isNullOrEmpty()) {
                    Log.d(TAG, "onPartialResults[1], NO BATCHES YET | add first")
                    currentBatches = arrayListOf(matches[0])
                } else {
                    Log.d(TAG, "onPartialResults[1], current batches $currentBatches")
                    val prevBatchLength = currentBatches[currentBatches.lastIndex].length
                    val match = if (config?.disableRepeatingFilter == true) matches[0] else repeatingFilter(matches[0])
                    val matchLength = match.length
                    if (config?.androidDisableBatchHandling == true || matchLength + 3 < prevBatchLength) {
                        Log.d(TAG, "onPartialResults[2], append new batch")
                        currentBatches.add(match)
                    } else {
                        Log.d(TAG, "onPartialResults[2], update batch, replace #${currentBatches.lastIndex}")
                        currentBatches[currentBatches.lastIndex] = match
                    }
                }
                resultBatches = currentBatches
                onFinishRecognition(currentBatches, null, false)
            }

            override fun onEvent(eventType: Int, params: Bundle?) {}     
        }
    }

    // Filters out 2 or more consecutive duplicate words, like "and and"
    private fun repeatingFilter(text: String): String {
        var words = text.split(Regex("\\s+")).filter { it.isNotBlank() }
        if (words.isEmpty()) {
            return ""
        }

        val joiner = StringBuilder()

        // 10 - arbitrary number of last substrings that is still unstable
        // and needs to be filtered. Prev substrings were handled earlier.
        if (words.size >= 10) {
            joiner.append(words.take(words.size - 9).joinToString(" "))
            words = words.takeLast(10)
        } else {
            joiner.append(words.first())
        }

        for (i in words.indices) {
            if (i == 0) continue
            // Always add number-containing strings.
            if (Regex("\\d+").containsMatchIn(words[i])) {
                joiner.append(" ").append(words[i])
                continue
            }

            // Skip consecutive duplicate strings.
            if (words[i] == words[i - 1]) continue
            joiner.append(" ").append(words[i])
        }
        return joiner.toString()
    }

    private fun normalizeRmsDb(rmsdB: Float): Double {
        if (!rmsdB.isFinite()) {
            return 0.0
        }

        if (noiseFloorDb.isNaN()) {
            noiseFloorDb = rmsdB
        }
        if (peakDb.isNaN()) {
            peakDb = rmsdB + MIN_SPAN_DB
        }

        val floorAlpha = if (rmsdB < noiseFloorDb) FLOOR_FALL_ALPHA else FLOOR_RISE_ALPHA
        noiseFloorDb += floorAlpha * (rmsdB - noiseFloorDb)

        val peakAlpha = if (rmsdB > peakDb) PEAK_ATTACK_ALPHA else PEAK_DECAY_ALPHA
        peakDb += peakAlpha * (rmsdB - peakDb)

        val span = max(peakDb - noiseFloorDb, MIN_SPAN_DB)
        val raw = ((rmsdB - noiseFloorDb) / span).coerceIn(0f, 1f)
        val smoothingCoeff = if (raw > levelSmoothed) METER_ATTACK else METER_RELEASE
        levelSmoothed += smoothingCoeff * (raw - levelSmoothed)

        return ((levelSmoothed * PRECISION_SCALE).roundToInt() / PRECISION_SCALE).toDouble()
    }
  }