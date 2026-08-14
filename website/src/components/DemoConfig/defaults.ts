import type {LanguageId} from '../Phrases/phrases'

/** Hero language id → startListening locale. */
export const LANGUAGE_LOCALES: Record<LanguageId, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pl: 'pl-PL',
  ja: 'ja-JP',
  zh: 'zh-CN',
}

export const WORKLET_THREADS = ['ui', 'js', 'background'] as const
export type WorkletThread = (typeof WORKLET_THREADS)[number]

export const WORKLET_METHODS = [
  'startListening',
  'updateConfig',
  'getVoiceInputVolume',
  'stopListening',
] as const
export type WorkletMethod = (typeof WORKLET_METHODS)[number]

/** Which runtime each method chunk sits on. Order of methods is fixed. */
export type WorkletPlacement = Record<WorkletMethod, WorkletThread>

/** Volume starts on a background worklet; the rest on JS. */
export const WORKLET_PLACEMENT_DEFAULT: WorkletPlacement = {
  startListening: 'js',
  updateConfig: 'js',
  getVoiceInputVolume: 'background',
  stopListening: 'js',
}

export type DemoConfigState = {
  locale: string
  maskOffensiveWords: boolean
  autoFinishRecognitionMs: number
  autoFinishProgressIntervalMs: number
  resetAutoFinishVoiceSensitivity: number
  workletPlacement: WorkletPlacement
}

/** Package / API defaults (what the code sample treats as default). */
export const API_CONFIG_DEFAULTS: DemoConfigState = {
  locale: 'en-US',
  maskOffensiveWords: false,
  autoFinishRecognitionMs: 8000,
  autoFinishProgressIntervalMs: 1000,
  resetAutoFinishVoiceSensitivity: 0.4,
  workletPlacement: WORKLET_PLACEMENT_DEFAULT,
}

/** Hero demo starting state (masking on so ******* is visible). */
export const DEMO_CONFIG_DEFAULTS: DemoConfigState = {
  ...API_CONFIG_DEFAULTS,
  maskOffensiveWords: true,
}

export const TIMER_THRESHOLD_MIN_MS = 3000
export const TIMER_THRESHOLD_MAX_MS = 99_000
export const TIMER_THRESHOLD_STEP_MS = 1000

export const TIMER_INTERVAL_MIN_MS = 200
export const TIMER_INTERVAL_MAX_MS = 2000
export const TIMER_INTERVAL_STEP_MS = 200

export function clampStep(
  value: number,
  min: number,
  max: number,
  step: number,
): number {
  const clamped = Math.min(max, Math.max(min, value))
  return Math.round(clamped / step) * step
}

/** Sensitivity is a float slider — compare below its smallest visible step. */
export function almostEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.005
}

/** Feature anchors shared by hero [i] and code spans. */
export type FeatureId =
  | 'locale'
  | 'maskOffensiveWords'
  | 'autoFinishRecognitionMs'
  | 'autoFinishProgressIntervalMs'
  | 'resetAutoFinishVoiceSensitivity'
  | 'voiceVolume'
  | 'speechAnalyzer'
  | 'prewarm'
  | 'requestPermission'
  | 'updateConfig'
  | 'worklets'
  | 'startListening'
  | 'stopListening'
  | 'getVoiceInputVolume'
  | 'resetAutoFinishTime'
  | 'addAutoFinishTime'

/** A config field the demo chrome can actually change. */
export type ConfigKey = Exclude<keyof DemoConfigState, 'workletPlacement'>

/**
 * A sample line that can be revealed. `iosPreset` is revealable but not
 * settable — there is no control for it, so it only ever shows as the
 * commented default once the SpeechAnalyzer row asks for it.
 */
export type DirtyKey = ConfigKey | 'iosPreset'
