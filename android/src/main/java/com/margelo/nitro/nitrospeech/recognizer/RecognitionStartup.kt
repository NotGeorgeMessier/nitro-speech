package com.margelo.nitro.nitrospeech.recognizer

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

// Owned by the recognizer's main thread, including the validity checks after preparation.
internal class RecognitionStartup(private val scope: CoroutineScope) {
    private var generation = 0L
    private var preparation: Job? = null

    fun start(prepare: suspend (isCurrent: () -> Boolean) -> Unit) {
        cancel()
        val token = generation
        preparation = scope.launch { prepare { generation == token } }
    }

    fun cancelIfCurrent(isCurrent: () -> Boolean): Boolean {
        if (!isCurrent()) return false
        cancel()
        return true
    }

    fun cancel() {
        generation += 1
        preparation?.cancel()
        preparation = null
    }
}
