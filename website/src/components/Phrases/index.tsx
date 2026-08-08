import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type TransitionEvent,
} from 'react'

import InfoCorner from '../DemoConfig/InfoCorner'
import {useDemoSync} from '../Phone/DemoSync'
import type {PhoneLayout} from '../Phone/phoneLayout'
import PhraseText from './PhraseText'
import {phrases, SILENCE_AFTER_PHRASE_INDICES} from './phrases'
import styles from './PhraseFeed.module.css'

const VISIBLE_ROWS = 3
const ROW_MS = 900

type Props = {
  layout: PhoneLayout | null
  silent?: boolean
  /** Permissions locked — stop rolling new phrases. */
  frozen?: boolean
  /** Fired on every new phrase row (resets silence timer / drives language clock). */
  onPhrase?: (phraseIndex: number) => void
  /** Ask Phone sync to start silence after the trigger phrase. */
  onSilenceRequest?: () => void
}

type Row = {
  id: number
  text: string
}

export default function PhraseFeed({
  layout,
  silent = false,
  frozen = false,
  onPhrase,
  onSilenceRequest,
}: Props): ReactNode {
  const {seekEpoch, seekPhraseIndex} = useDemoSync()
  const [rows, setRows] = useState<Row[]>([])
  const [animateScroll, setAnimateScroll] = useState(true)
  const indexRef = useRef(0)
  const lastSeekRef = useRef(0)
  const silentRef = useRef(silent)
  silentRef.current = silent
  const frozenRef = useRef(frozen)
  frozenRef.current = frozen
  const onPhraseRef = useRef(onPhrase)
  onPhraseRef.current = onPhrase
  const onSilenceRequestRef = useRef(onSilenceRequest)
  onSilenceRequestRef.current = onSilenceRequest
  const ready = layout !== null
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (!ready || phrases.length === 0) return

    let cancelled = false
    let timer = 0
    const gap = reduce ? 400 : ROW_MS
    const paused = () => silentRef.current || frozenRef.current

    const push = (opts: {
      allowSilence: boolean
      /** When false, feed still scrolls but clock/timer don't step per line. */
      notify: boolean
    }): number => {
      const i = indexRef.current
      const phraseIndex = i % phrases.length
      const text = phrases[phraseIndex] ?? ''
      setAnimateScroll(!reduce)
      setRows((prev) => [...prev, {id: i, text}])
      indexRef.current = i + 1
      if (opts.notify) onPhraseRef.current?.(phraseIndex)
      if (opts.allowSilence && SILENCE_AFTER_PHRASE_INDICES.has(phraseIndex)) {
        onSilenceRequestRef.current?.()
      }
      return phraseIndex
    }

    const clear = () => window.clearTimeout(timer)

    const scheduleNormal = () => {
      timer = window.setTimeout(function tick() {
        if (cancelled || paused()) return
        push({allowSilence: true, notify: true})
        timer = window.setTimeout(tick, gap)
      }, gap)
    }

    // Flag seek: jump to the language's first phrase (no intermediate scrub).
    if (seekEpoch !== lastSeekRef.current) {
      lastSeekRef.current = seekEpoch
      const target = seekPhraseIndex
      const shown =
        indexRef.current === 0
          ? -1
          : (indexRef.current - 1 + phrases.length) % phrases.length

      if (shown === target) {
        if (!paused()) scheduleNormal()
        return () => {
          cancelled = true
          clear()
        }
      }

      const next = indexRef.current % phrases.length
      const skip = (target - next + phrases.length) % phrases.length
      indexRef.current += skip
      push({allowSilence: false, notify: true})
      if (!paused()) scheduleNormal()
      return () => {
        cancelled = true
        clear()
      }
    }

    if (silent || frozen) return

    // Resume immediately when silence / lock ends so the next phrases continue.
    push({allowSilence: true, notify: true})
    scheduleNormal()
    return () => {
      cancelled = true
      clear()
    }
  }, [ready, reduce, silent, frozen, seekEpoch, seekPhraseIndex])

  useEffect(() => {
    if (!reduce) return
    if (rows.length <= VISIBLE_ROWS) return
    setRows((prev) => prev.slice(-VISIBLE_ROWS))
  }, [reduce, rows.length])

  const onScrollEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== 'transform') return
    if (rows.length <= VISIBLE_ROWS) return

    // Drop rows above the window and reset offset without animating —
    // same pixels on screen, so the roll continues seamlessly.
    setAnimateScroll(false)
    setRows((prev) => prev.slice(-VISIBLE_ROWS))
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimateScroll(true))
    })
  }

  if (!layout) return null

  const {bottomHalf} = layout
  // Compact row pitch — feed is shorter than the outer phone panel.
  const rowH = bottomHalf.height / (VISIBLE_ROWS + 2.8)
  const feedH = rowH * VISIBLE_ROWS
  const hidden = Math.max(0, rows.length - VISIBLE_ROWS)
  const scrollY = hidden * rowH

  const feedStyle: CSSProperties = {
    ['--feed-h' as string]: `${feedH}px`,
    ['--row-h' as string]: `${rowH}px`,
  }

  return (
    <div className={styles.feed} style={feedStyle}>
      <InfoCorner
        placement="head"
        featureId="maskOffensiveWords"
        label="About maskOffensiveWords"
      />
      <div
        className={styles.clip}
        aria-live="polite"
        aria-relevant="additions">
        <div
          className={styles.track}
          style={{
            transform: `translate3d(0, ${-scrollY}px, 0)`,
            transition:
              reduce || !animateScroll
                ? 'none'
                : 'transform 480ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          onTransitionEnd={onScrollEnd}>
          {rows.map((row) => (
            <div key={row.id} className={styles.row}>
              <PhraseText text={row.text} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
