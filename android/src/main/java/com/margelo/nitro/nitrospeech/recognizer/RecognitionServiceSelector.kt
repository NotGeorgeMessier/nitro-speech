package com.margelo.nitro.nitrospeech.recognizer

/**
 * Which recognizer [android.speech.SpeechRecognizer.createSpeechRecognizer] should bind.
 *
 * The platform no-arg factory uses only Settings.Secure `voice_recognition_service`.
 * That setting is empty on some devices that still have a RecognitionService installed
 * (Xiaomi/MIUI, Android 16), and recognition then fails immediately with
 * "no selected voice recognition service". Selection is pure so it can be unit tested
 * without an Android runtime.
 */
internal data class InstalledRecognitionService(
  val packageName: String,
  val className: String,
)

internal sealed class RecognitionServiceSelection {
  /** Setting is non-blank. Leave the component choice to the platform. */
  data object SystemDefault : RecognitionServiceSelection()

  /** Setting is empty. Bind this installed service explicitly. */
  data class Explicit(
    val packageName: String,
    val className: String,
  ) : RecognitionServiceSelection()

  /** Setting is empty and nothing installed can be bound. */
  data object NoneAvailable : RecognitionServiceSelection()
}

internal object RecognitionServiceSelector {
  /**
   * [android.provider.Settings.Secure] key read by [android.speech.SpeechRecognizer].
   * The SDK field is hidden, so callers must pass this literal to `getString`.
   * The stored value is a flattened [android.content.ComponentName], or empty when
   * the user has not selected a default.
   */
  const val SETTINGS_KEY = "voice_recognition_service"

  /**
   * @param defaultService value of [SETTINGS_KEY], or null.
   * @param installed services that handle `android.speech.RecognitionService`, in
   * PackageManager match order. Consulted only when [defaultService] is blank.
   */
  fun select(
    defaultService: String?,
    installed: List<InstalledRecognitionService>,
  ): RecognitionServiceSelection {
    if (!defaultService.isNullOrBlank()) {
      return RecognitionServiceSelection.SystemDefault
    }
    val service = installed.firstOrNull { it.packageName.isNotBlank() && it.className.isNotBlank() }
      ?: return RecognitionServiceSelection.NoneAvailable
    return RecognitionServiceSelection.Explicit(
      packageName = service.packageName,
      className = service.className,
    )
  }

  /**
   * Trace passed to `onError` when recognition cannot start because no service exists.
   * Kept next to [select] so the string the JS callback sees stays covered by the unit test.
   */
  fun missingServiceTrace(): String {
    return ErrorTrace.join(
      "HybridRecognizer",
      "start",
      "OnDeviceSupport",
      "createRecognizer",
      "noRecognitionService",
    )
  }
}

internal class NoRecognitionServiceException : IllegalStateException(
  "No speech recognition service is installed and voice_recognition_service is unset",
)
