package com.margelo.nitro.nitrospeech.recognizer

import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.SpeechRecognizer
import com.margelo.nitro.nitrospeech.SpeechRecognitionConfig
import com.margelo.nitro.nitrospeech.SpeechRecognitionError
import com.margelo.nitro.nitrospeech.VolumeChangeEvent
import com.margelo.nitro.nitrospeech.recognizer.logic.ResultBatchAccumulator
import com.margelo.nitro.nitrospeech.recognizer.logic.SpeechErrorMapper
import com.margelo.nitro.nitrospeech.recognizer.logic.VolumeMeter

class RecognitionListenerSession (
    private val autoStopper: AutoStopper?,
    private val config: SpeechRecognitionConfig?,
    private val fireVolumeChangeEvent: (event: VolumeChangeEvent) -> Unit,
    private val onFinishRecognition: (result: ArrayList<String>?, error: SpeechRecognitionError?, recordingStopped: Boolean) -> Unit,
) {
    private val logger = Logger(disable = false)
    private val volumeMeter = VolumeMeter()
    private val batchAccumulator = ResultBatchAccumulator(
        disableRepeatingFilter = config?.disableRepeatingFilter == true,
        disableBatchHandling = config?.androidDisableBatchHandling == true,
    )

    fun createRecognitionListener(): RecognitionListener {
        volumeMeter.reset()
        batchAccumulator.reset()
        return object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {
                val volumeEvent = getVolume(rmsdB)
                fireVolumeChangeEvent(volumeEvent)
                if (volumeMeter.shouldResetTimer(
                        volumeEvent.rawVolume,
                        config?.resetAutoFinishVoiceSensitivity,
                    )
                ) {
                    autoStopper?.resetTimer()
                }
            }
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {}

            override fun onError(error: Int) {
                val message = SpeechErrorMapper.message(error)
                logger.log("onError: $message")
                val mappedError = when (SpeechErrorMapper.map(error, config?.onDevice != null)) {
                    SpeechErrorMapper.Kind.ON_DEVICE_MODEL_NOT_INSTALLED ->
                        SpeechRecognitionError.ONDEVICEMODELNOTINSTALLED
                    SpeechErrorMapper.Kind.ON_DEVICE_NOT_SUPPORTED ->
                        SpeechRecognitionError.ONDEVICENOTSUPPORTED
                    SpeechErrorMapper.Kind.RECOGNITION_TASK_FAILED ->
                        SpeechRecognitionError.RECOGNITIONTASKFAILED
                }
                onFinishRecognition(
                    null,
                    mappedError,
                    true
                )
                autoStopper?.stop()
                autoStopper?.onTimeout()
            }

            override fun onResults(results: Bundle?) {
                val currentBatches = batchAccumulator.snapshot()
                logger.log("onResults: $currentBatches")
                onFinishRecognition(currentBatches, null, true)
                autoStopper?.stop()
                autoStopper?.onTimeout()
            }

            override fun onPartialResults(partialResults: Bundle?) {
                val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)

                if (matches.isNullOrEmpty() || matches[0] == "") {
                    logger.log("onPartialResults[0], skip, NO RECOGNIZE")
                    return
                }

                autoStopper?.resetTimer()
                logger.log("onPartialResults[0], add ${matches[0]}")
                val currentBatches = batchAccumulator.onPartial(matches[0]) ?: return
                onFinishRecognition(ArrayList(currentBatches), null, false)
            }

            override fun onEvent(eventType: Int, params: Bundle?) {}     
        }
    }

    private fun getVolume(rmsdB: Float): VolumeChangeEvent {
        val sample = volumeMeter.process(rmsdB)
        return VolumeChangeEvent(
            smoothedVolume = sample.smoothedVolume,
            rawVolume = sample.rawVolume,
            db = sample.db
        )
    }
  }