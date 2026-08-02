import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/** How long phrase/chart silence lasts after the trigger phrase. */
export const DEMO_SILENCE_MS = 3500

/** Flip on to restore phrase/chart silence breaks. */
export const DEMO_SILENCE_ENABLED = true

/** Default auto-finish silence timer length (ms). */
export const DEMO_TIMER_THRESHOLD_MS = 8000

/** Default progress step between expiration animations (ms). */
export const DEMO_TIMER_INTERVAL_MS = 1000

export const TIMER_THRESHOLD_MIN_MS = 3000
export const TIMER_THRESHOLD_MAX_MS = 99_000
export const TIMER_THRESHOLD_STEP_MS = 1000

export const TIMER_INTERVAL_MIN_MS = 200
export const TIMER_INTERVAL_MAX_MS = 2000
export const TIMER_INTERVAL_STEP_MS = 200

function clampStep(value: number, min: number, max: number, step: number): number {
  const clamped = Math.min(max, Math.max(min, value))
  return Math.round(clamped / step) * step
}

type DemoSyncValue = {
  /** Charts / phrase feed pause while true. */
  silent: boolean
  beginSilence: () => void
  /** Bump when a phrase row is rendered — resets the silence timer. */
  notifyPhrase: (phraseIndex: number) => void
  phraseEpoch: number
  /** Latest phrase index in the demo loop (for language clock, etc.). */
  phraseIndex: number
  /** Bumps when a language flag requests a scrub to a phrase index. */
  seekEpoch: number
  /** Target phrase index for the active seek (language block start). */
  seekPhraseIndex: number
  /** Scrub the phrase feed forward to this index (skips silence). */
  seekToPhrase: (phraseIndex: number) => void
  /**
   * Mic distance volume (1 = default wave position).
   * Closer → >1, further → <1. Applied to newly pushed chart samples only.
   */
  volumeRatio: number
  setVolumeRatio: (ratio: number) => void
  timerThresholdMs: number
  timerIntervalMs: number
  setTimerThresholdMs: (ms: number | ((prev: number) => number)) => void
  setTimerIntervalMs: (ms: number | ((prev: number) => number)) => void
}

const DemoSyncContext = createContext<DemoSyncValue | null>(null)

/**
 * Hero-wide demo sync (owned by Phone domain).
 * Wrap features that share phrase / silence / timer timing.
 */
export function DemoSyncProvider({children}: {children: ReactNode}): ReactNode {
  const [silent, setSilent] = useState(false)
  const [phraseEpoch, setPhraseEpoch] = useState(0)
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [seekEpoch, setSeekEpoch] = useState(0)
  const [seekPhraseIndex, setSeekPhraseIndex] = useState(0)
  const [volumeRatio, setVolumeRatioRaw] = useState(1)
  const [timerThresholdMs, setThresholdRaw] = useState(DEMO_TIMER_THRESHOLD_MS)
  const [timerIntervalMs, setIntervalRaw] = useState(DEMO_TIMER_INTERVAL_MS)

  useEffect(() => {
    if (!silent) return
    const id = window.setTimeout(() => setSilent(false), DEMO_SILENCE_MS)
    return () => window.clearTimeout(id)
  }, [silent])

  const beginSilence = useCallback(() => {
    if (!DEMO_SILENCE_ENABLED) return
    setSilent(true)
  }, [])
  const notifyPhrase = useCallback((index: number) => {
    setPhraseIndex(index)
    setPhraseEpoch((n) => n + 1)
  }, [])

  const seekToPhrase = useCallback((index: number) => {
    setSilent(false)
    setSeekPhraseIndex(index)
    setSeekEpoch((n) => n + 1)
  }, [])

  const setVolumeRatio = useCallback((ratio: number) => {
    setVolumeRatioRaw(Math.min(2, Math.max(0.15, ratio)))
  }, [])

  const setTimerThresholdMs = useCallback(
    (ms: number | ((prev: number) => number)) => {
      setThresholdRaw((prev) =>
        clampStep(
          typeof ms === 'function' ? ms(prev) : ms,
          TIMER_THRESHOLD_MIN_MS,
          TIMER_THRESHOLD_MAX_MS,
          TIMER_THRESHOLD_STEP_MS,
        ),
      )
    },
    [],
  )

  const setTimerIntervalMs = useCallback(
    (ms: number | ((prev: number) => number)) => {
      setIntervalRaw((prev) =>
        clampStep(
          typeof ms === 'function' ? ms(prev) : ms,
          TIMER_INTERVAL_MIN_MS,
          TIMER_INTERVAL_MAX_MS,
          TIMER_INTERVAL_STEP_MS,
        ),
      )
    },
    [],
  )

  const value = useMemo(
    () => ({
      silent,
      beginSilence,
      notifyPhrase,
      phraseEpoch,
      phraseIndex,
      seekEpoch,
      seekPhraseIndex,
      seekToPhrase,
      volumeRatio,
      setVolumeRatio,
      timerThresholdMs,
      timerIntervalMs,
      setTimerThresholdMs,
      setTimerIntervalMs,
    }),
    [
      silent,
      beginSilence,
      notifyPhrase,
      phraseEpoch,
      phraseIndex,
      seekEpoch,
      seekPhraseIndex,
      seekToPhrase,
      volumeRatio,
      setVolumeRatio,
      timerThresholdMs,
      timerIntervalMs,
      setTimerThresholdMs,
      setTimerIntervalMs,
    ],
  )

  return (
    <DemoSyncContext.Provider value={value}>{children}</DemoSyncContext.Provider>
  )
}

export function useDemoSync(): DemoSyncValue {
  const ctx = useContext(DemoSyncContext)
  if (!ctx) {
    throw new Error('useDemoSync must be used within DemoSyncProvider')
  }
  return ctx
}
