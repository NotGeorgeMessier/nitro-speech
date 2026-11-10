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
        assertEquals(listOf("First sentence.", "Hello world."), finalRecognitionBatches(partials, listOf("First sentence. Hello world.")))
        assertEquals(listOf("First sentence.", "Hello wor"), partials)
    }

    @Test fun acceptsCorrectionsToEarlierBatchesWithoutDuplicatingText() {
        val partials = arrayListOf("First wrong sentence.", "Second sent")
        assertEquals(listOf("First corrected sentence. Second sentence."), finalRecognitionBatches(partials, listOf("First corrected sentence. Second sentence.")))
    }

    @Test fun appliesTheConfiguredRepeatingWordFilterToFinalResults() {
        val result = listOf("hello hello world")
        assertEquals(listOf("hello world"), finalRecognitionBatches(arrayListOf("hello world"), result))
        assertEquals(listOf("hello hello world"), finalRecognitionBatches(null, result, filterRepeats = false))
    }

    @Test fun keepsPartialTextWhenTheFinalResultIsMissingOrEmpty() {
        val partials = arrayListOf("Keep this")
        for (matches in listOf(null, emptyList(), listOf(""), listOf("   "))) {
            assertEquals(partials, finalRecognitionBatches(partials, matches))
        }
        assertNull(finalRecognitionBatches(null, null))
    }
}
