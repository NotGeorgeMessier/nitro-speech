package com.margelo.nitro.nitrospeech.recognizer.logic

class ResultBatchAccumulator(
  private val disableRepeatingFilter: Boolean,
  private val disableBatchHandling: Boolean,
) {
  private var resultBatches: ArrayList<String>? = null

  fun reset() {
    resultBatches = null
  }

  fun snapshot(): ArrayList<String>? {
    return resultBatches?.let { ArrayList(it) }
  }

  /**
   * @return updated batches, or null when the partial should be skipped.
   */
  fun onPartial(rawMatch: String): List<String>? {
    if (rawMatch.isEmpty()) {
      return null
    }

    var currentBatches = resultBatches
    if (currentBatches.isNullOrEmpty()) {
      currentBatches = arrayListOf(rawMatch)
    } else {
      val prevBatchLength = currentBatches[currentBatches.lastIndex].length
      val match = if (disableRepeatingFilter) rawMatch else RepeatingFilter.apply(rawMatch)
      val matchLength = match.length
      if (disableBatchHandling || matchLength + 3 < prevBatchLength) {
        currentBatches.add(match)
      } else {
        currentBatches[currentBatches.lastIndex] = match
      }
    }
    resultBatches = currentBatches
    return currentBatches.toList()
  }
}
