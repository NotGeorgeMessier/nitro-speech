package com.margelo.nitro.nitrospeech.recognizer

import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class RecognitionStartupTest {
    private fun startup() = RecognitionStartup(CoroutineScope(Dispatchers.Unconfined))

    @Test fun stopDuringPermissionOrModelPreparationNeverStartsRecording() {
        for (phase in listOf("permission", "model")) {
            val startup = startup()
            val ready = CompletableDeferred<Unit>()
            var microphoneOpened = false
            startup.start { isCurrent ->
                ready.await()
                if (isCurrent()) microphoneOpened = true
            }
            startup.cancel()
            ready.complete(Unit)
            assertFalse(phase, microphoneOpened)
        }
    }

    @Test fun stopInvalidatesWorkAlreadyQueuedToOpenTheMicrophone() {
        val startup = startup()
        var queuedStart: (() -> Unit)? = null
        var microphoneOpened = false
        startup.start { isCurrent -> queuedStart = { if (isCurrent()) microphoneOpened = true } }
        startup.cancel()
        queuedStart?.invoke()
        assertFalse(microphoneOpened)
    }

    @Test fun onlyTheLatestStartCanOpenTheMicrophone() {
        val startup = startup()
        val queuedStarts = mutableListOf<() -> Unit>()
        var recordings = 0
        repeat(2) {
            startup.start { isCurrent -> queuedStarts.add { if (isCurrent()) recordings += 1 } }
        }
        queuedStarts.forEach { it() }
        assertEquals(1, recordings)
    }

    @Test fun anOldSessionsQueuedStopCannotCancelANewerStart() {
        val startup = startup()
        val oldSession = Any()
        var activeSession = oldSession
        val queuedStop = { startup.cancelIfCurrent { activeSession === oldSession } }
        activeSession = Any()
        val ready = CompletableDeferred<Unit>()
        var microphoneOpened = false
        startup.start { isCurrent ->
            ready.await()
            if (isCurrent()) microphoneOpened = true
        }
        assertFalse(queuedStop())
        ready.complete(Unit)
        assertTrue(microphoneOpened)
    }

    @Test fun normalPreparationCanStartAndBeStopped() {
        val startup = startup()
        val ready = CompletableDeferred<Unit>()
        var microphoneOpened = false
        var current: (() -> Boolean)? = null
        startup.start { isCurrent ->
            current = isCurrent
            ready.await()
            if (isCurrent()) microphoneOpened = true
        }
        ready.complete(Unit)
        assertTrue(microphoneOpened)
        assertTrue(current?.invoke() == true)
        startup.cancel()
        assertFalse(current?.invoke() == true)
    }
}
