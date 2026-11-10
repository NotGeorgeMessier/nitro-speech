package com.margelo.nitro.nitrospeech.recognizer

// Filters out 2 or more consecutive duplicate words, like "and and"
internal fun filterRepeatingWords(text: String): String {
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

