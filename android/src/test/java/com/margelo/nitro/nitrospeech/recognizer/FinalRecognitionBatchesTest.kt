package com.margelo.nitro.nitrospeech.recognizer

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class FinalRecognitionBatchesTest {
    @Test fun returnsTextWhenNoPartialResultWasDelivered() {
        assertEquals(listOf("Hello world"), finalRecognitionBatches(null, listOf("Hello world", "Yellow world")))
        assertEquals(listOf("Hello world"), finalRecognitionBatches(arrayListOf(), listOf("Hello world")))
    }

    @Test fun replacesTheLastPartialWithoutChangingCompletedBatches() {
        val partials = arrayListOf("First sentence.", "Hello wor")
        assertEquals(listOf("First sentence.", "Hello world."), finalRecognitionBatches(partials, listOf("Hello world.")))
        assertEquals(listOf("First sentence.", "Hello wor"), partials)
    }

    @Test fun keepsPartialTextWhenTheFinalResultIsMissingOrEmpty() {
        val partials = arrayListOf("Keep this")
        for (matches in listOf(null, emptyList(), listOf(""), listOf("   "))) {
            assertEquals(partials, finalRecognitionBatches(partials, matches))
        }
        assertNull(finalRecognitionBatches(null, null))
    }
}
