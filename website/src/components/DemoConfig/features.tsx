import Link from '@docusaurus/Link'
import type {ReactNode} from 'react'

import type {CodeTabId} from '../CodeSamples/samples'
import type {DirtyKey, FeatureId} from './defaults'

export type Feature = {
  id: FeatureId
  /** Code tab to open when the feature is focused. */
  tab: CodeTabId
  /**
   * Feature-list row to highlight for ids that have no row of their own.
   * Omitted when the feature is its own row.
   */
  anchor?: FeatureId
  /** Config keys to reveal (commented default) when an [i] is pressed. */
  reveal?: DirtyKey[]
  /** Code marks to highlight together (timer total + interval, etc.). */
  highlightWith?: FeatureId[]
  /** Present when the feature owns a feature-list row. */
  row?: {title: ReactNode; blurb: ReactNode}
}

/**
 * Silence total + tick interval are revealed and highlighted as a pair, so
 * they have to satisfy both list types at once.
 */
const TIMER_KEYS: (DirtyKey & FeatureId)[] = [
  'autoFinishRecognitionMs',
  'autoFinishProgressIntervalMs',
]

const APPLE = {
  speechAnalyzer:
    'https://developer.apple.com/documentation/speech/speechanalyzer',
  speechTranscriber:
    'https://developer.apple.com/documentation/speech/speechtranscriber',
  dictationTranscriber:
    'https://developer.apple.com/documentation/speech/dictationtranscriber',
} as const

/** External doc link — underline via FeatureList `:global(.featureDocLink)`. */
function Ext({href, children}: {href: string; children: ReactNode}): ReactNode {
  return (
    <Link
      className="featureDocLink"
      href={href}
      target="_blank"
      rel="noopener noreferrer">
      {children}
    </Link>
  )
}

/** Internal docs link. */
function Doc({to, children}: {to: string; children: ReactNode}): ReactNode {
  return (
    <Link className="featureDocLink" to={to}>
      {children}
    </Link>
  )
}

/**
 * Every feature anchor shared by the hero [i] buttons, the code samples and
 * the feature list — one entry per id, so adding a feature is a single edit.
 * Declaration order is the feature-list order; anchored ids follow their row.
 *
 * Rows are the package's selling points, strongest first — not an API
 * inventory. A hero [i] only sets `anchor` when a row genuinely covers it;
 * unanchored ids still switch tabs and highlight their code marks.
 *
 * Every id needs a trigger — a hero [i] or a row. An id whose tab can only be
 * reached by clicking the tab itself is dead weight, so it goes away together
 * with its tab and its sample rather than sitting here waiting for a future
 * [i] that never arrives.
 */
const FEATURES: Feature[] = [
  {
    id: 'speechAnalyzer',
    tab: 'quickstart',
    reveal: ['iosPreset'],
    row: {
      title: (
        <>
          iOS 26 <Ext href={APPLE.speechAnalyzer}>SpeechAnalyzer</Ext>
        </>
      ),
      blurb: (
        <>
          The only library running the new{' '}
          <Ext href={APPLE.speechTranscriber}>SpeechTranscriber</Ext> and{' '}
          <Ext href={APPLE.dictationTranscriber}>DictationTranscriber</Ext>{' '}
          engines — select one with{' '}
          <Doc to="/docs/features/real-time-transcription#transcription-preset">
            iosPreset
          </Doc>
          , with SFSpeechRecognizer fallback below iOS 26.
        </>
      ),
    },
  },
  {
    id: 'locale',
    tab: 'quickstart',
    anchor: 'speechAnalyzer',
    reveal: ['locale'],
  },

  {
    id: 'worklets',
    tab: 'worklets',
    row: {
      title: (
        <>
          Full support for{' '}
          <Ext href="https://docs.swmansion.com/react-native-worklets/">
            react-native-worklets
          </Ext>
        </>
      ),
      blurb:
        'All methods are thread-safe and can be called from the UI thread or custom worklets.',
    },
  },
  {id: 'startListening', tab: 'worklets', anchor: 'worklets'},
  {id: 'getVoiceInputVolume', tab: 'worklets', anchor: 'worklets'},
  {id: 'stopListening', tab: 'worklets', anchor: 'worklets'},

  {
    id: 'autoFinishRecognitionMs',
    tab: 'quickstart',
    reveal: TIMER_KEYS,
    highlightWith: TIMER_KEYS,
    row: {
      title: (
        <>
          Silence auto-finish{' '}
          <Doc to="/docs/features/silence-timer">timer</Doc>
        </>
      ),
      blurb:
        'Auto-stop on silence with progress ticks, one-off time top-ups, and a volume threshold that keeps the session alive.',
    },
  },
  {
    id: 'autoFinishProgressIntervalMs',
    tab: 'quickstart',
    anchor: 'autoFinishRecognitionMs',
    reveal: TIMER_KEYS,
    highlightWith: TIMER_KEYS,
  },
  {
    id: 'resetAutoFinishVoiceSensitivity',
    tab: 'live',
    anchor: 'autoFinishRecognitionMs',
    reveal: ['resetAutoFinishVoiceSensitivity'],
  },
  {id: 'resetAutoFinishTime', tab: 'live', anchor: 'autoFinishRecognitionMs'},
  {id: 'addAutoFinishTime', tab: 'live', anchor: 'autoFinishRecognitionMs'},

  {
    id: 'voiceVolume',
    tab: 'volume',
    row: {
      title: (
        <>
          Voice input <Doc to="/docs/features/voice-input-volume">volume</Doc>
        </>
      ),
      blurb:
        'Smoothed, raw, and dB levels from one hook — read them on the UI thread to drive meters, or gate your own logic.',
    },
  },

  // Two separate lifecycle stories, deliberately not merged into one row:
  // prewarm is what makes the on-device path viable, updateConfig is what you
  // reach for once a session is already running.
  {
    id: 'prewarm',
    tab: 'prewarm',
    row: {
      title: (
        <>
          <Doc to="/docs/features/prewarm">Prewarm</Doc> &{' '}
          <Doc to="/docs/features/on-device.preview">on-device</Doc> models
        </>
      ),
      blurb:
        'Prepare the engine, request permissions, resolve the locale, and install the on-device model in advance.',
    },
  },
  {
    id: 'requestPermission',
    tab: 'prewarm',
    anchor: 'prewarm',
  },

  {
    id: 'updateConfig',
    tab: 'live',
    row: {
      title: (
        <>
          Live config <Doc to="/docs/features/update-config">updates</Doc>
        </>
      ),
      blurb:
        'Retune the silence timer, voice sensitivity, and haptics inside an active session — no stop, no restart.',
    },
  },

  // Deliberately unanchored: the hero [i] reveals the config line and
  // highlights it in the sample, but no selling-point row covers masking.
  {id: 'maskOffensiveWords', tab: 'quickstart', reveal: ['maskOffensiveWords']},
]

const BY_ID = new Map<FeatureId, Feature>(FEATURES.map((f) => [f.id, f]))

export type FeatureRow = Feature & {row: NonNullable<Feature['row']>}

export const FEATURE_ROWS: FeatureRow[] = FEATURES.filter(
  (f): f is FeatureRow => f.row != null,
)

export function featureTab(id: FeatureId): CodeTabId | undefined {
  return BY_ID.get(id)?.tab
}

export function featureListAnchor(id: FeatureId): FeatureId {
  return BY_ID.get(id)?.anchor ?? id
}

export function featureHighlightIds(id: FeatureId): FeatureId[] {
  return BY_ID.get(id)?.highlightWith ?? [id]
}

export function featureRevealKeys(id: FeatureId): DirtyKey[] {
  return BY_ID.get(id)?.reveal ?? []
}
