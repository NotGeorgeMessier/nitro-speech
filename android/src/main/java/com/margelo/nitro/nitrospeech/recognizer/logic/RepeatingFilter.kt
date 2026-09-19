package com.margelo.nitro.nitrospeech.recognizer.logic

object RepeatingFilter {
  /**
   * Drops consecutive duplicate words while always keeping number-containing tokens.
   * A stable prefix of 10- tokens is preserved; only the last 10 tokens are filtered.
   */
  fun apply(text: String): String {
    var words = text.split(Regex("\\s+")).filter { it.isNotBlank() }
    if (words.isEmpty()) {
      return ""
    }

    val joiner = StringBuilder()

    if (words.size >= 10) {
      joiner.append(words.take(words.size - 9).joinToString(" "))
      words = words.takeLast(10)
    } else {
      joiner.append(words.first())
    }

    for (i in words.indices) {
      if (i == 0) continue
      if (Regex("\\d+").containsMatchIn(words[i])) {
        joiner.append(" ").append(words[i])
        continue
      }
      if (words[i] == words[i - 1]) continue
      joiner.append(" ").append(words[i])
    }
    return joiner.toString()
  }
}
