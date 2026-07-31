import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
  type TransitionEvent,
} from 'react'

import {phrases} from './phrases'
import type {PhoneLayout} from './phoneLayout'
import styles from './PhraseFeed.module.css'

const VISIBLE_ROWS = 3
const ROW_MS = 1600

type Props = {
  layout: PhoneLayout | null
}

type Row = {
  id: number
  text: string
}

export default function PhraseFeed({layout}: Props): ReactNode {
  const [rows, setRows] = useState<Row[]>([])
  const [animateScroll, setAnimateScroll] = useState(true)
  const ready = layout !== null
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (!ready || phrases.length === 0) return

    let i = 0
    const gap = reduce ? 400 : ROW_MS

    const push = () => {
      const text = phrases[i % phrases.length] ?? ''
      setAnimateScroll(!reduce)
      setRows((prev) => [...prev, {id: i, text}])
      i += 1
    }

    push()
    const id = window.setInterval(push, gap)
    return () => window.clearInterval(id)
  }, [ready, reduce])

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
