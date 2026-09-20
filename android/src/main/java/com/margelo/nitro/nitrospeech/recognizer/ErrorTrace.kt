package com.margelo.nitro.nitrospeech.recognizer

internal object ErrorTrace {
  fun join(vararg segments: String): String {
    return segments.filter { it.isNotEmpty() }.joinToString(".")
  }
}
