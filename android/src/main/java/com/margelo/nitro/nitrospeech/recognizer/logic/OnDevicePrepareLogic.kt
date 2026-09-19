package com.margelo.nitro.nitrospeech.recognizer.logic

object OnDevicePrepareLogic {
  enum class Decision {
    UseOnDevice,
    UseFallback,
    NotSupported,
    ModelNotInstalled,
    NeedsDownload,
  }

  const val TIRAMISU_API = 33

  fun beforeDownload(
    serviceAvailable: Boolean,
    requireOnDevice: Boolean,
    apiLevel: Int,
    localeInstalled: Boolean,
  ): Decision {
    if (!serviceAvailable) {
      return if (requireOnDevice) Decision.NotSupported else Decision.UseFallback
    }
    if (apiLevel < TIRAMISU_API) {
      return Decision.UseOnDevice
    }
    if (localeInstalled) {
      return Decision.UseOnDevice
    }
    return Decision.NeedsDownload
  }

  fun afterDownload(
    requireOnDevice: Boolean,
    downloadSucceeded: Boolean,
    localeInstalled: Boolean,
  ): Decision {
    if (downloadSucceeded || localeInstalled) {
      return Decision.UseOnDevice
    }
    return if (requireOnDevice) Decision.ModelNotInstalled else Decision.UseFallback
  }
}
