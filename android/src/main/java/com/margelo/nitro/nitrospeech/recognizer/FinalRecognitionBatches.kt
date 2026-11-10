package com.margelo.nitro.nitrospeech.recognizer

internal fun finalRecognitionBatches(
    partialBatches: ArrayList<String>?,
    matches: List<String>?,
    filterRepeats: Boolean = true,
): ArrayList<String>? {
    val result = matches?.firstOrNull()?.takeIf { it.isNotBlank() }
        ?: return partialBatches
    val finalText = if (filterRepeats) filterRepeatingWords(result) else result
    val completed = partialBatches.orEmpty().dropLast(1)
    val prefix = completed.joinToString(" ")
    // Android's final hypothesis covers the full session, not only the current batch.
    return when {
        completed.isEmpty() -> arrayListOf(finalText)
        finalText == prefix -> ArrayList(completed)
        finalText.startsWith("$prefix ") -> ArrayList(completed).apply {
            add(finalText.removePrefix("$prefix "))
        }
        else -> arrayListOf(finalText)
    }
}
