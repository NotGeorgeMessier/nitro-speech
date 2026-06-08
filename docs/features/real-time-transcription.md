# Real-time transcription

## Partial results

As the user speaks, `onResult` callback is called with partial results.

Each time `onResult` callback is called means either:
- last batch (last item) is updated
- new batch (new item) is added

All the batches (items) before the last one are guaranteed to be complete and won't be updated anymore.

## Handling results

```typescript
// From the hook
const {
  // other methods...
} = useRecognizer(
  {
    // other callbacks...
    onResult: (resultBatches: string[]) => {
      // Your logic here
    },
  },
  // destroy deps...
);

// From the hybrid object, 
// Not recommended. Direct access to the hybrid object. Not safe. Only for advanced usage.
SpeechRecognizer.onResult = (resultBatches: string[]) => {
  // Your advanced logic here
};
```

## Haptic Feedback

Haptic feedback on recording start/stop.

Exposed options from `HapticFeedbackStyle` enum.

Enabled by default, use `none` to disable.

iOS and Android: `startHapticFeedbackStyle` and `stopHapticFeedbackStyle` flags

Config property for:
- `startListening`
- `prewarm`
- `updateConfig`

Mutable during the session: ✅

## Batch handling

Quality of life feature to filter out empty or repeated batches of results.

iOS: Automatically works.

Android 13+: `androidDisableBatchHandling` flag

Config property for:
- `startListening`
- `prewarm`

Mutable during the session: ❌

When to disable batch handling?

- Mostly never, but on Android in some very rare cases **batch handling** may skip the batches that contain the real data. If you see it's your case, activate this flag and handle the results manually.

## Repeating word filter

Quality of life feature to filter out consecutive duplicate words from results.

iOS and Android: `disableRepeatingFilter` flag

Config property for:
- `startListening`
- `updateConfig`

Mutable during the session: ✅

My subjective opinion: repeated words usually don't impact the meaning of the sentence, but if you think otherwise, activate this flag.

## Offensive word masking

Mask offensive words with asterisks.

iOS 26+: `maskOffensiveWords` flag

iOS <26: ❌

Android 13+: `maskOffensiveWords` flag

Config property for:
- `startListening`
- `prewarm`

Mutable during the session: ❌

## Contextual strings

Domain-specific vocabulary for improved accuracy.

An array of strings that should be recognized, even if they are not in the system vocabulary.

Use this property to specify short custom phrases that are unique to your app.
You might include phrases with the names of characters, products, or places that are specific to your app.
You might also include domain-specific terminology or unusual or made-up words.
Assigning custom phrases to this property improves the likelihood of those phrases being recognized.
Keep phrases relatively brief, limiting them to one or two words whenever possible.
Lengthy phrases are less likely to be recognized.
In addition, try to limit each phrase to something the user can say without pausing.
Limit the total number of phrases to no more than 100.

Config property for:
- `startListening`
- `prewarm`

Mutable during the session: ❌

## Language model selection

Choose between web search vs free-form models.

Language model based on web search terms may not work on some devices.

Reference: https://developer.android.com/reference/kotlin/android/speech/RecognizerIntent?hl=en#EXTRA_LANGUAGE_MODEL:kotlin.String

Android only: `androidUseWebSearchModel` flag

Config property for:
- `startListening`
- `prewarm`

Mutable during the session: ❌

## Formatting quality

Prefer quality vs speed in formatting.

Preferring quality over latency may break auto-finish(silence timer), depends on device.

Reference: https://developer.android.com/reference/kotlin/android/speech/RecognizerIntent?hl=en#EXTRA_ENABLE_FORMATTING:kotlin.String

Android only: `androidFormattingPreferQuality` flag

Config property for:
- `startListening`
- `prewarm`

Mutable during the session: ❌

## Transcription preset

* `"shortForm"` - For a short phrase or sentence, also disables punctuation
* `"speed"` - Gives priority to speed over accuracy
* `"general"` - For longer speeches, more accurate but delayed response

iOS only: `iosPreset` flag

Config property for:
- `startListening`
- `prewarm`

Mutable during the session: ❌

## Automatic punctuation

Add punctuation to speech recognition results.

iOS 16+: `iosAddPunctuation` flag

Android: Automatically works.

Config property for:
- `startListening`
- `prewarm`

Mutable during the session: ❌

## Atypical speech hint

Hint iOS that speech may include accent, lisp, or other confounding traits.

iOS 26+: `iosAtypicalSpeech` flag

Config property for:
- `startListening`
- `prewarm`

Mutable during the session: ❌
