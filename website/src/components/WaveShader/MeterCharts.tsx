import {useEffect, useMemo, useState, type ReactNode} from 'react'

import {METER_WINDOW, meterSamples} from './meterData'
import styles from './MeterCharts.module.css'

const TICK_MS = 220
const LOOP = meterSamples.length // 3N

function normDb(db: number) {
  // Map typical speech dB band into 0..1 for bar height.
  return Math.min(1, Math.max(0, (db + 55) / 20))
}

type RowProps = {
  label: string
  values: number[]
  current: number
  format: (v: number) => string
}

function MeterRow({label, values, current, format}: RowProps): ReactNode {
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

export default function MeterCharts(): ReactNode {
  const [offset, setOffset] = useState(0)
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reduce || LOOP === 0) return
    const id = window.setInterval(() => {
      setOffset((o) => (o + 1) % LOOP)
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [reduce])

  const windowSamples = useMemo(() => {
    const out = []
    for (let i = 0; i < METER_WINDOW; i++) {
      out.push(meterSamples[(offset + i) % LOOP]!)
    }
    return out
  }, [offset])

  const last = windowSamples[windowSamples.length - 1]!
  const rawVals = windowSamples.map((s) => s.raw)
  const smoothVals = windowSamples.map((s) => s.smooth)
  const dbVals = windowSamples.map((s) => normDb(s.db))

  return (
    <div className={styles.stack} aria-hidden="true">
      <MeterRow
        label="raw"
        values={rawVals}
        current={last.raw}
        format={(v) => v.toFixed(3)}
      />
      <MeterRow
        label="smooth"
        values={smoothVals}
        current={last.smooth}
        format={(v) => v.toFixed(3)}
      />
      <MeterRow
        label="db"
        values={dbVals}
        current={last.db}
        format={(v) => v.toFixed(1)}
      />
    </div>
  )
}
