import {
  almostEqual,
  API_CONFIG_DEFAULTS,
  WORKLET_METHODS,
  type ConfigKey,
  type DemoConfigState,
  type DirtyKey,
  type FeatureId,
  type WorkletMethod,
  type WorkletThread,
} from '../DemoConfig/defaults'

export type CodeTabId =
  | 'quickstart'
  | 'prewarm'
  | 'volume'
  | 'live'
  | 'worklets'

export const CODE_TABS: {id: CodeTabId; label: string}[] = [
  {id: 'quickstart', label: 'Quickstart'},
  {id: 'prewarm', label: 'Prewarm'},
  {id: 'volume', label: 'Volume'},
  {id: 'live', label: 'Live updates'},
  {id: 'worklets', label: 'Worklets'},
]

/**
 * Marker: [[featureId|text]] — rendered as highlightable spans, stripped on
 * copy. Both readers live here so the samples own the format end to end.
 */
const MARK_RE = /\[\[([a-zA-Z]+)\|([^\]]+)\]\]/g

export type CodeToken = {
  text: string
  /** Set for [[featureId|…]] spans, null for plain code. */
  featureId: FeatureId | null
}

export function parseMarkers(source: string): CodeToken[] {
  const tokens: CodeToken[] = []
  let last = 0
  let m: RegExpExecArray | null
  MARK_RE.lastIndex = 0
  while ((m = MARK_RE.exec(source)) !== null) {
    if (m.index > last) {
      tokens.push({text: source.slice(last, m.index), featureId: null})
    }
    tokens.push({text: m[2] ?? '', featureId: m[1] as FeatureId})
    last = m.index + m[0].length
  }
  if (last < source.length) {
    tokens.push({text: source.slice(last), featureId: null})
  }
  return tokens
}

export function stripMarkers(source: string): string {
  return source.replace(MARK_RE, '$2')
}

type SampleInput = DemoConfigState & {
  dirty: Partial<Record<DirtyKey, boolean>>
}

function sens(v: number): string {
  return Number(v.toFixed(2)).toString()
}

/**
 * Config line for a key that doubles as its feature id:
 * - omit when at API default and never touched
 * - active when changed from API default
 * - commented default when dirty/revealed (icon click or returned to default)
 */
function configLine(
  input: SampleInput,
  key: ConfigKey,
  format: (v: string | number | boolean) => string = String,
): string | null {
  const value = input[key]
  const apiDefault = API_CONFIG_DEFAULTS[key]
  const atDefault =
    typeof value === 'number' && typeof apiDefault === 'number'
      ? almostEqual(value, apiDefault)
      : value === apiDefault

  if (atDefault && !input.dirty[key]) return null
  if (atDefault) {
    return `  [[${key}|// ${key}: ${format(apiDefault)}, // default]]`
  }
  return `  [[${key}|${key}: ${format(value)}]],`
}

function maskLine(input: SampleInput): string {
  if (input.maskOffensiveWords) {
    return `  [[maskOffensiveWords|maskOffensiveWords: true]], // default false`
  }
  return `  [[maskOffensiveWords|// maskOffensiveWords: false, // default]]`
}

function localeLine(input: SampleInput): string {
  // Always present — even at the API default. The only field exempt from the
  // hide-until-revealed rule: the phrase feed drives it live, so hiding it
  // while it happens to sit on en-US would desync the sample from the phone.
  return `  [[locale|locale: '${input.locale}']],`
}

function presetLine(input: SampleInput): string | null {
  // The demo chrome has no control for it, so it can never leave the default —
  // it only ever appears as the commented default the SpeechAnalyzer row
  // reveals. The engine names ride inside the mark so the reveal highlights
  // the part that is actually the selling point.
  if (!input.dirty.iosPreset) return null
  return `  [[speechAnalyzer|// iOS 26+ engine: 'general' → SpeechTranscriber
  // 'shortform' | 'speed' → DictationTranscriber
  // iosPreset: 'general', // default]]`
}

function buildQuickstartConfig(input: SampleInput): string {
  const lines = [
    maskLine(input),
    localeLine(input),
    presetLine(input),
    configLine(input, 'autoFinishRecognitionMs'),
    configLine(input, 'autoFinishProgressIntervalMs'),
    configLine(input, 'resetAutoFinishVoiceSensitivity', (v) => sens(Number(v))),
  ].filter((l): l is string => l != null)

  if (lines.length === 0) return 'startListening({})'
  return `startListening({\n${lines.join('\n')}\n})`
}

function buildLiveUpdateConfig(): string {
  // Fixed values from docs/examples/use-recognizer.md.
  return `[[updateConfig|RecognizerRef.updateConfig]](
  {
    // Set auto-finish to 12 seconds, 500ms interval, 0.65 sensitivity
    [[autoFinishRecognitionMs|autoFinishRecognitionMs: 12000]],
    [[autoFinishProgressIntervalMs|autoFinishProgressIntervalMs: 500]],
    [[resetAutoFinishVoiceSensitivity|resetAutoFinishVoiceSensitivity: 0.65]],
  }
)`
}

function indentLines(block: string, indent: string): string {
  if (!indent) return block
  return block
    .split('\n')
    .map((line) => (line.length ? indent + line : line))
    .join('\n')
}

function methodCall(
  input: SampleInput,
  method: WorkletMethod,
  indent: string,
): string {
  switch (method) {
    case 'startListening': {
      const call = stripMarkers(
        buildQuickstartConfig(input).replace(
          /^startListening/,
          'RecognizerRef.startListening',
        ),
      )
      return indentLines(call, indent)
    }
    case 'updateConfig':
      return indentLines(stripMarkers(buildLiveUpdateConfig()), indent)
    case 'getVoiceInputVolume':
      return `${indent}const volume = RecognizerRef.getVoiceInputVolume()`
    case 'stopListening':
      return `${indent}RecognizerRef.stopListening()`
  }
}

function wrapThread(thread: WorkletThread, body: string): string {
  if (thread === 'js') return body
  if (thread === 'ui') {
    return `[[worklets|scheduleOnUI(() => {
${body}
})]]`
  }
  return `[[worklets|scheduleOnRuntime(runtime, () => {
${body}
})]]`
}

function workletImports(): string {
  return `import {
  createWorkletRuntime,
  scheduleOnRuntime,
  scheduleOnUI,
} from 'react-native-worklets'
import { RecognizerRef } from 'react-native-nitro-speech'`
}

function buildWorkletsSample(input: SampleInput): string {
  const placement = input.workletPlacement
  const groups: {thread: WorkletThread; methods: WorkletMethod[]}[] = []
  for (const method of WORKLET_METHODS) {
    const thread = placement[method]
    const last = groups[groups.length - 1]
    if (last && last.thread === thread) last.methods.push(method)
    else groups.push({thread, methods: [method]})
  }

  const usesBackground = groups.some((g) => g.thread === 'background')
  const blocks = groups.map((g) => {
    const inner = g.thread === 'js' ? '' : '  '
    const body = g.methods.map((m) => methodCall(input, m, inner)).join('\n')
    return wrapThread(g.thread, body)
  })

  const runtimeLine = usesBackground
    ? `\n\nconst runtime = createWorkletRuntime({ name: 'speech' })`
    : ''

  return `${workletImports()}${runtimeLine}

${blocks.join('\n\n')}`
}

/** Demo samples — source and comments stay English even if the page is i18n’d. */
export function buildSamples(input: SampleInput): Record<CodeTabId, string> {
  const locale = input.locale

  return {
    quickstart: `import { useRecognizer } from 'react-native-nitro-speech'

const { startListening, stopListening } = useRecognizer({
  onReadyForSpeech: () => console.log('Listening...'),
  onRecordingStopped: () => console.log('Stopped'),
  onResult: (textBatches) => console.log('Result:', textBatches.join('\\n')),
  onAutoFinishProgress: (timeLeftMs) => 
    console.log('Auto-finish in:', timeLeftMs, 'ms'),
  onError: (code) => console.log('Error:', code),
  onPermissionDenied: () => console.log('Permission denied'),
})

${buildQuickstartConfig(input)}`,

    prewarm: `import { RecognizerRef } from 'react-native-nitro-speech'

await [[prewarm|RecognizerRef.prewarm]](
  {
    [[locale|locale: '${locale}']],
  },
  {
    [[requestPermission|// requestPermission: true, // default; startListening also requests by default]]
    [[prewarm|// loadOnDeviceModel: true, // default; no-op unless onDevice is 'prefer' | 'require'
    // (onDevice defaults: iOS 26+ 'prefer'; iOS <26 & Android: disabled)]]
  },
)`,

    volume: `import { useVoiceInputVolume } from 'react-native-nitro-speech'

const { [[voiceVolume|smoothedVolume, rawVolume, db]] } = useVoiceInputVolume()

// smoothedVolume  // 0…1 — UI animations
// rawVolume       // 0…1 — logic / quick reaction
// db              // decibels (not smoothed)`,

    live: `import { RecognizerRef } from 'react-native-nitro-speech'

// Update config during active session
${buildLiveUpdateConfig()}

[[resetAutoFinishTime|RecognizerRef.resetAutoFinishTime()]]

// Add 5 seconds to the auto-finish time once without changing the timer threshold
[[addAutoFinishTime|RecognizerRef.addAutoFinishTime(5000)]]
`,

    worklets: buildWorkletsSample(input),
  }
}
