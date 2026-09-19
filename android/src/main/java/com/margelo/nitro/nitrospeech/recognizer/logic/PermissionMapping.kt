package com.margelo.nitro.nitrospeech.recognizer.logic

object PermissionMapping {
  enum class Status {
    GRANTED,
    DENIED,
    NOT_REQUESTED,
  }

  fun from(granted: Boolean, hasRequested: Boolean): Status {
    return when {
      granted -> Status.GRANTED
      hasRequested -> Status.DENIED
      else -> Status.NOT_REQUESTED
    }
  }
}
