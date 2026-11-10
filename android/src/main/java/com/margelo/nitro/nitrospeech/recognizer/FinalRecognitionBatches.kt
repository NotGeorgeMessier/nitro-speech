package com.margelo.nitro.nitrospeech.recognizer

internal fun finalRecognitionBatches(
    partialBatches: ArrayList<String>?,
    matches: List<String>?,
): ArrayList<String>? {
    val finalText = matches?.firstOrNull()?.takeIf { it.isNotBlank() }
        ?: return partialBatches
    if (partialBatches.isNullOrEmpty()) return arrayListOf(finalText)
    return ArrayList(partialBatches).apply { this[lastIndex] = finalText }
}
