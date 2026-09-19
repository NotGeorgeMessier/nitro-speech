package com.margelo.nitro.nitrospeech.recognizer.logic

object LocaleTags {
  fun normalize(locale: String): String {
    return locale.replace('_', '-')
  }

  fun isListed(locales: List<String>, locale: String): Boolean {
    val target = normalize(locale)
    return locales.any { normalize(it).equals(target, ignoreCase = true) }
  }
}
