import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {featureRevealKeys} from './features'
import type {CodeTabId} from '../CodeSamples/samples'
import {
  almostEqual,
  clampStep,
  DEMO_CONFIG_DEFAULTS,
  TIMER_INTERVAL_MAX_MS,
  TIMER_INTERVAL_MIN_MS,
  TIMER_INTERVAL_STEP_MS,
  TIMER_THRESHOLD_MAX_MS,
  TIMER_THRESHOLD_MIN_MS,
  TIMER_THRESHOLD_STEP_MS,
  type DemoConfigState,
  type DirtyKey,
  type FeatureId,
  type WorkletMethod,
  type WorkletThread,
} from './defaults'

type DemoConfigValue = DemoConfigState & {
  dirty: Partial<Record<DirtyKey, boolean>>
  setLocale: (locale: string) => void
  setMaskOffensiveWords: (on: boolean) => void
  toggleMaskOffensiveWords: () => void
  setAutoFinishRecognitionMs: (ms: number | ((prev: number) => number)) => void
  setAutoFinishProgressIntervalMs: (
    ms: number | ((prev: number) => number),
  ) => void
  setResetAutoFinishVoiceSensitivity: (v: number) => void
  setWorkletThread: (method: WorkletMethod, thread: WorkletThread) => void
  resetConfig: () => void
  /** Bumps on reset so chrome holding its own position can snap back. */
  resetEpoch: number
  highlightId: FeatureId | null
  highlightEpoch: number
  /** When set, the samples panel opens this tab instead of featureTab(id). */
  highlightTab: CodeTabId | null
  focusFeature: (id: FeatureId, tab?: CodeTabId, scroll?: boolean) => void
}

const DemoConfigContext = createContext<DemoConfigValue | null>(null)

function scrollRootFor(el: HTMLElement): HTMLElement | Window {
  let p: HTMLElement | null = el.parentElement
  while (p) {
    const {overflowY} = getComputedStyle(p)
    if (
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      p.scrollHeight > p.clientHeight
    ) {
      return p
    }
    p = p.parentElement
  }
  return window
}

/** Scroll the features section under the fixed navbar (single explicit scroll). */
function scrollToFeatures(): void {
  const el = document.querySelector<HTMLElement>('[data-features]')
  if (!el) return
  const nav = document.querySelector<HTMLElement>('.navbar')
  const navH = nav?.getBoundingClientRect().height ?? 60
  const pad = 24
  const root = scrollRootFor(el)
  const elTop = el.getBoundingClientRect().top

  if (root === window) {
    const y = window.scrollY + elTop - navH - pad
    window.scrollTo({top: Math.max(0, y), behavior: 'smooth'})
    return
  }

  const rootEl = root as HTMLElement
  const rootTop = rootEl.getBoundingClientRect().top
  const y = rootEl.scrollTop + (elTop - rootTop) - navH - pad
  rootEl.scrollTo({top: Math.max(0, y), behavior: 'smooth'})
}

export function DemoConfigProvider({
  children,
}: {
  children: ReactNode
}): ReactNode {
  const [config, setConfig] = useState<DemoConfigState>(DEMO_CONFIG_DEFAULTS)
  const [dirty, setDirty] = useState<Partial<Record<DirtyKey, boolean>>>({})
  const [highlightId, setHighlightId] = useState<FeatureId | null>(null)
  const [highlightEpoch, setHighlightEpoch] = useState(0)
  const [highlightTab, setHighlightTab] = useState<CodeTabId | null>(null)
  const [resetEpoch, setResetEpoch] = useState(0)

  const markDirty = useCallback((key: DirtyKey) => {
    setDirty((d) => (d[key] ? d : {...d, [key]: true}))
  }, [])

  const markDirtyKeys = useCallback((keys: DirtyKey[]) => {
    setDirty((d) => {
      let next = d
      for (const key of keys) {
        if (!next[key]) next = {...next, [key]: true}
      }
      return next
    })
  }, [])

  const setLocale = useCallback(
    (locale: string) => {
      setConfig((c) => {
        if (c.locale === locale) return c
        markDirty('locale')
        return {...c, locale}
      })
    },
    [markDirty],
  )

  const setMaskOffensiveWords = useCallback(
    (on: boolean) => {
      setConfig((c) => {
        if (c.maskOffensiveWords === on) return c
        markDirty('maskOffensiveWords')
        return {...c, maskOffensiveWords: on}
      })
    },
    [markDirty],
  )

  const toggleMaskOffensiveWords = useCallback(() => {
    markDirty('maskOffensiveWords')
    setConfig((c) => ({...c, maskOffensiveWords: !c.maskOffensiveWords}))
  }, [markDirty])

  const setAutoFinishRecognitionMs = useCallback(
    (ms: number | ((prev: number) => number)) => {
      setConfig((c) => {
        const next = clampStep(
          typeof ms === 'function' ? ms(c.autoFinishRecognitionMs) : ms,
          TIMER_THRESHOLD_MIN_MS,
          TIMER_THRESHOLD_MAX_MS,
          TIMER_THRESHOLD_STEP_MS,
        )
        if (next === c.autoFinishRecognitionMs) return c
        markDirty('autoFinishRecognitionMs')
        return {...c, autoFinishRecognitionMs: next}
      })
    },
    [markDirty],
  )

  const setAutoFinishProgressIntervalMs = useCallback(
    (ms: number | ((prev: number) => number)) => {
      setConfig((c) => {
        const next = clampStep(
          typeof ms === 'function' ? ms(c.autoFinishProgressIntervalMs) : ms,
          TIMER_INTERVAL_MIN_MS,
          TIMER_INTERVAL_MAX_MS,
          TIMER_INTERVAL_STEP_MS,
        )
        if (next === c.autoFinishProgressIntervalMs) return c
        markDirty('autoFinishProgressIntervalMs')
        return {...c, autoFinishProgressIntervalMs: next}
      })
    },
    [markDirty],
  )

  const setResetAutoFinishVoiceSensitivity = useCallback(
    (v: number) => {
      setConfig((c) => {
        const next = Math.min(1, Math.max(0.1, v))
        if (almostEqual(next, c.resetAutoFinishVoiceSensitivity)) return c
        markDirty('resetAutoFinishVoiceSensitivity')
        return {...c, resetAutoFinishVoiceSensitivity: next}
      })
    },
    [markDirty],
  )

  const setWorkletThread = useCallback(
    (method: WorkletMethod, thread: WorkletThread) => {
      setConfig((c) => {
        if (c.workletPlacement[method] === thread) return c
        return {
          ...c,
          workletPlacement: {...c.workletPlacement, [method]: thread},
        }
      })
    },
    [],
  )

  const resetConfig = useCallback(() => {
    // locale is demo-driven — the language clock mirrors whatever the phrase
    // feed is showing — so snapping it to en-US would contradict the phone.
    setConfig((c) => ({...DEMO_CONFIG_DEFAULTS, locale: c.locale}))
    setDirty({})
    setHighlightId(null)
    setHighlightTab(null)
    setResetEpoch((n) => n + 1)
  }, [])

  const focusFeature = useCallback(
    (id: FeatureId, tab?: CodeTabId, scroll = true) => {
      const reveal = featureRevealKeys(id)
      if (reveal.length) markDirtyKeys(reveal)

      setHighlightId(id)
      setHighlightTab(tab ?? null)
      setHighlightEpoch((n) => n + 1)

      if (!scroll) return
      // Wait for reveal + tab switch layout, then one explicit window scroll.
      window.setTimeout(scrollToFeatures, 100)
    },
    [markDirtyKeys],
  )

  const value = useMemo(
    () => ({
      ...config,
      dirty,
      setLocale,
      setMaskOffensiveWords,
      toggleMaskOffensiveWords,
      setAutoFinishRecognitionMs,
      setAutoFinishProgressIntervalMs,
      setResetAutoFinishVoiceSensitivity,
      setWorkletThread,
      resetConfig,
      resetEpoch,
      highlightId,
      highlightEpoch,
      highlightTab,
      focusFeature,
    }),
    [
      config,
      dirty,
      setLocale,
      setMaskOffensiveWords,
      toggleMaskOffensiveWords,
      setAutoFinishRecognitionMs,
      setAutoFinishProgressIntervalMs,
      setResetAutoFinishVoiceSensitivity,
      setWorkletThread,
      resetConfig,
      resetEpoch,
      highlightId,
      highlightEpoch,
      highlightTab,
      focusFeature,
    ],
  )

  return (
    <DemoConfigContext.Provider value={value}>
      {children}
    </DemoConfigContext.Provider>
  )
}

export function useDemoConfig(): DemoConfigValue {
  const ctx = useContext(DemoConfigContext)
  if (!ctx) {
    throw new Error('useDemoConfig must be used within DemoConfigProvider')
  }
  return ctx
}
