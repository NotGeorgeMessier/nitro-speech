import {useEffect, useRef, useState, type ReactNode} from 'react'

import {METER_WINDOW} from './meterData'
import styles from './MeterCharts.module.css'
import {
  createMeterStream,
  DEMO_TICK_MS,
  type MeterStream,
} from './meterStream'

/** Dense samples across the visible window for a continuous stroke. */
const SMOOTH_POINTS = METER_WINDOW * 2
const VB_W = 100
const VB_H = 28

function normDb(db: number) {
  // Map typical speech dB band into 0..1 for bar height.
  return Math.min(1, Math.max(0, (db + 55) / 20))
}

function linePath(values: number[]): string {
  const n = values.length
  let d = ''
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * VB_W
    const y = VB_H * (1 - values[i]! * 0.92)
    d += i === 0 ? `M${x.toFixed(2)} ${y.toFixed(2)}` : `L${x.toFixed(2)} ${y.toFixed(2)}`
  }
  return d
}

function areaPath(values: number[]): string {
  return `${linePath(values)}L${VB_W} ${VB_H}L0 ${VB_H}Z`
}

function BarRow({
  label,
  values,
  current,
  format,
}: {
  label: string
  values: number[]
  current: number
  format: (v: number) => string
}): ReactNode {
  return (
    <div className={styles.row}>
      <div className={styles.meta}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{format(current)}</span>
      </div>
      <div className={styles.bars} aria-hidden="true">
        {values.map((v, i) => (
          <div
            key={i}
            className={styles.bar}
            style={{height: `${Math.max(0.04, v) * 100}%`}}
          />
        ))}
      </div>
    </div>
  )
}

function SmoothRow({
  values,
  current,
}: {
  values: number[]
  current: number
}): ReactNode {
  return (
    <div className={styles.row}>
      <div className={styles.meta}>
        <span className={styles.label}>smooth</span>
        <span className={styles.value}>{current.toFixed(3)}</span>
      </div>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        aria-hidden="true">
        <path className={styles.area} d={areaPath(values)} />
        <path className={styles.line} d={linePath(values)} />
      </svg>
    </div>
  )
}

/** Shared playback clock + append-only sample stream. */
function useMeterPlayback(silent: boolean): {t: number; stream: MeterStream} {
  const streamRef = useRef<MeterStream | null>(null)
  if (streamRef.current == null) streamRef.current = createMeterStream()
  const stream = streamRef.current

  const silentRef = useRef(silent)
  silentRef.current = silent
  const startRef = useRef<number | null>(null)
  const [t, setT] = useState(0)

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reduce) {
      const id = window.setInterval(() => {
        setT((prev) => {
          let next = prev + 1
          stream.ensure(next, silentRef.current)
          next -= stream.compact(next)
          return next
        })
      }, DEMO_TICK_MS)
      return () => window.clearInterval(id)
    }

    let raf = 0
    const frame = (now: number) => {
      if (startRef.current == null) startRef.current = now
      let next = (now - startRef.current) / DEMO_TICK_MS
      stream.ensure(next, silentRef.current)
      const dropped = stream.compact(next)
      if (dropped > 0) {
        startRef.current += dropped * DEMO_TICK_MS
        next -= dropped
      }
      setT(next)
      raf = window.requestAnimationFrame(frame)
    }
    raf = window.requestAnimationFrame(frame)
    return () => window.cancelAnimationFrame(raf)
  }, [reduce, stream])

  return {t, stream}
}

type Props = {
  silent?: boolean
}

/**
 * Phone meter demo:
 * - raw / db: discrete bars from the shared stream window
 * - smooth: continuous SVG stroke (interpolated); readout stays on the discrete sample
 * - silence: only newly appended samples go quiet; older bars scroll off naturally
 */
export default function MeterCharts({silent = false}: Props): ReactNode {
  const {t, stream} = useMeterPlayback(silent)
  const tick = Math.floor(t)

  const windowSamples = stream.windowAt(tick)
  const last = windowSamples[windowSamples.length - 1]!
  const rawVals = windowSamples.map((s) => s.raw)
  const dbVals = windowSamples.map((s) => normDb(s.db))
  const smoothVals = stream.smoothSeries(t, SMOOTH_POINTS)

  return (
    <div className={styles.stack} aria-hidden="true">
      <BarRow
        label="raw"
        values={rawVals}
        current={last.raw}
        format={(v) => v.toFixed(3)}
      />
      <SmoothRow values={smoothVals} current={last.smooth} />
      <BarRow
        label="db"
        values={dbVals}
        current={last.db}
        format={(v) => v.toFixed(1)}
      />
    </div>
  )
}
