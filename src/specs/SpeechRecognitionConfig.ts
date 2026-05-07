interface ParamsAndroid {
  /**
   * Prefer quality over latency (may break autofinish, depends on device)
   *
   * @since Android 13+
   *
   * @default false
   */
  androidFormattingPreferQuality?: boolean
  /**
   * Language model based on web search terms. (may not work on some devices)
   *
   * Free form model by default
   *
   * @default false
   */
  androidUseWebSearchModel?: boolean
  /**
   * Without batch handling the result will contain empty or same content batches.
   *
   * @default false
   */
  androidDisableBatchHandling?: boolean
}

type IosPreset = 'shortform' | 'general'

interface ParamsIOS {
  /**
   * Add punctuation to speech recognition results
   *
   * @since iOS 16.0+
   *
   * @default true
   */
  iosAddPunctuation?: boolean
  /**
   * `"shortForm"` - for a short phrase or sentence, also disables punctuation
   *
   * `"general"` - for longer speeches, more accurate but delayed response
   *
   * @since iOS 26.0+
   *
   * @default "general"
   */
  iosPreset?: IosPreset
  /**
   * A processing hint indicating that the audio is from a speaker with a heavy accent, lisp, or other confounding factor.
   *
   * @since iOS 26.0+
   *
   * @default false
   */
  iosAtypicalSpeech?: boolean
}

type HapticFeedbackStyle = 'light' | 'medium' | 'heavy' | 'none'

export interface MutableSpeechRecognitionConfig {
  /**
   * Silence timer duration with no voice detected
   *
   * for Android - undefined behavior for > 300_000ms (5 minutes)
   *
   * @default 8000
   */
  autoFinishRecognitionMs?: number
  /**
   * The interval at which `onAutoFinishProgress` will be triggered.
   *
   * min: 50ms,
   *
   * max: {@link autoFinishRecognitionMs}
   *
   * @default 1000
   */
  autoFinishProgressIntervalMs?: number
  /**
   * The voice detector sensitivity to reset the auto finish timer.
   *
   * Adjust for your expected environment.
   *
   * `0.00` - `1.00`
   *
   * `0.10` - Quiet room level
   *
   * `0.40` - Default, street, medium restaurant background, office level
   *
   * `0.60` - Loud restaurants, noisy office, party, highly crowded places level
   *
   * `1` - Use to disable volume-based reset of the auto finish timer
   *
   * @default 0.40
   */
  resetAutoFinishVoiceSensitivity?: number
  /**
   * Lots of repeating words in a row can be annoying
   *
   * @default false
   */
  disableRepeatingFilter?: boolean
  /**
   * Haptic feedback level when microphone starts recording.
   *
   * Use `"none"` to disable.
   *
   * @default "medium"
   */
  startHapticFeedbackStyle?: HapticFeedbackStyle
  /**
   * Haptic feedback level when microphone stops recording.
   *
   * Use `"none"` to disable.
   *
   * @default "medium"
   */
  stopHapticFeedbackStyle?: HapticFeedbackStyle
}

/**
 * @note Configuration for android and ios may behave differently
 * for the same properties, test both platforms
 *
 * Use `Plarform.select()` to match expectations
 */
export interface SpeechRecognitionConfig
  extends MutableSpeechRecognitionConfig, ParamsAndroid, ParamsIOS {
  /**
   * @default "en-US"
   *
   * @example
   * "fr-FR"
   * "pt-PT"
   * "pt-BR"
   *
   */
  locale?: string
  /**
   * An array of strings that should be recognized, even if they are not in the system vocabulary.
   *
   * Use this property to specify short custom phrases that are unique to your app.
   *
   * You might include phrases with the names of characters, products, or places that are specific to your app.
   *
   * You might also include domain-specific terminology or unusual or made-up words.
   *
   * Assigning custom phrases to this property improves the likelihood of those phrases being recognized.
   *
   * Keep phrases relatively brief, limiting them to one or two words whenever possible.
   * Lengthy phrases are less likely to be recognized.
   * In addition, try to limit each phrase to something the user can say without pausing.
   *
   * Limit the total number of phrases to no more than 100.
   *
   * @default []
   */
  contextualStrings?: string[]
  /**
   * Mask offensive words with asterisks.
   *
   * @since Android 13+
   * @since iOS 26+ (iOS <26: always `false`)
   *
   * @default false
   */
  maskOffensiveWords?: boolean
}
