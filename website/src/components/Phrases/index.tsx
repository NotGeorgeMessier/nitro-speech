import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type TransitionEvent,
} from 'react'

import type {PhoneLayout} from '../Phone/phoneLayout'
import {phrases, SILENCE_AFTER_PHRASE_INDEX} from './phrases'
import styles from './PhraseFeed.module.css'

const VISIBLE_ROWS = 3
const ROW_MS = 1600

type Props = {
  layout: PhoneLayout | null
  silent?: boolean
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
  onSilenceRequest,
}: Props): ReactNode {
  const [rows, setRows] = useState<Row[]>([])
  const [animateScroll, setAnimateScroll] = useState(true)
  const indexRef = useRef(0)
  const onSilenceRequestRef = useRef(onSilenceRequest)
  onSilenceRequestRef.current = onSilenceRequest
  const ready = layout !== null
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (!ready || phrases.length === 0 || silent) return

    const gap = reduce ? 400 : ROW_MS

    const push = () => {
      const i = indexRef.current
      const phraseIndex = i % phrases.length
      const text = phrases[phraseIndex] ?? ''
      setAnimateScroll(!reduce)
      setRows((prev) => [...prev, {id: i, text}])
      indexRef.current = i + 1
      if (phraseIndex === SILENCE_AFTER_PHRASE_INDEX) {
        onSilenceRequestRef.current?.()
      }
    }

    // Resume immediately when silence ends so the next phrases continue.
    push()
    const id = window.setInterval(push, gap)
    return () => window.clearInterval(id)
  }, [ready, reduce, silent])

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
              {row.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
