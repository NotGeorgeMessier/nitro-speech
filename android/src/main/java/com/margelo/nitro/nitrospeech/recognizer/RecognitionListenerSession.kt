package com.margelo.nitro.nitrospeech.recognizer

import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.SpeechRecognizer
import android.util.Log
import com.margelo.nitro.nitrospeech.Params

class RecognitionListenerSession (
    private val autoStopper: AutoStopper?,
    private val config: Params?,
    private val onFinishRecognition: (result: ArrayList<String>?, errorMessage: String?, recordingStopped: Boolean) -> Unit,
) {
    companion object {
        private const val TAG = "HybridRecognizer"
    }

    private var resultBatches: ArrayList<String>? = null

    fun createRecognitionListener(): RecognitionListener {
        resultBatches = null
        return object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {
                autoStopper?.indicateRecordingActivity()
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
                    if (config?.disableBatchHandling == true || matchLength + 3 < prevBatchLength) {
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

    // Filters out 2 or more repeating words in a row, like "and and"
    private fun repeatingFilter(text: String): String {
        val words = text.split(Regex("\\s+")).toMutableList()
        var joiner = words[0]
        for (i in words.indices) {
        if (i == 0) continue
        if (words[i] == words[i-1]) continue
        joiner += " ${words[i]}"
        }
        return joiner
    }
  }