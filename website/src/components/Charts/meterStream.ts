import {METER_WINDOW, meterSamples, type MeterSample} from './meterData'

/** One meter sample step (bars advance on this cadence). */
export const DEMO_TICK_MS = 220

const LOOP = meterSamples.length

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/** Low, still-varied noise-floor sample for the silence phase. */
export function silenceSample(t: number): MeterSample {
  const a = 0.5 + 0.5 * Math.sin(t * 0.61)
  const b = 0.5 + 0.5 * Math.sin(t * 1.27 + 1.1)
  const raw = 0.05 + 0.04 * a + 0.025 * b
  const smooth = 0.07 + 0.03 * Math.sin(t * 0.37 + 0.4)
  const db = -50 - 7 * (1 - raw / 0.12)
  return {raw, smooth, db}
}

/**
 * Append-only meter stream shared by raw / smooth / db charts.
 *
 * Silence only affects newly pushed samples — existing history keeps scrolling
 * off the left edge instead of rewriting the whole window.
 */
export type MeterStream = {
  /** Ensure history covers [floor(t), floor(t) + METER_WINDOW). */
  ensure: (t: number, silent: boolean) => void
  /** Discrete visible window (bar charts). */
  windowAt: (tick: number) => MeterSample[]
  /** Linearly interpolated sample at continuous time t. */
  sampleAt: (t: number) => MeterSample
  /**
   * Dense smooth-series across the visible window starting at t
   * (continuous stroke for the smooth chart).
   */
  smoothSeries: (t: number, points: number) => number[]
  /**
   * Drop consumed prefix so history stays bounded.
   * Returns how much to subtract from the playback clock t.
   */
  compact: (t: number) => number
}

export function createMeterStream(): MeterStream {
  const history: MeterSample[] = []
  for (let i = 0; i < METER_WINDOW; i++) {
    history.push(meterSamples[i % LOOP]!)
  }

  let speechIndex = METER_WINDOW
  let silenceIndex = 0

  const push = (silent: boolean) => {
    if (silent) {
      history.push(silenceSample(silenceIndex++))
      return
    }
    silenceIndex = 0
    history.push(meterSamples[speechIndex % LOOP]!)
    speechIndex += 1
  }

  const sampleAt = (t: number): MeterSample => {
    const max = history.length - 1
    if (max < 0) return {raw: 0, smooth: 0, db: -60}
    const tc = Math.min(Math.max(0, t), max)
    const i0 = Math.floor(tc)
    const i1 = Math.min(i0 + 1, max)
    const f = tc - i0
    const a = history[i0]!
    const b = history[i1]!
    return {
      raw: lerp(a.raw, b.raw, f),
      smooth: lerp(a.smooth, b.smooth, f),
      db: lerp(a.db, b.db, f),
    }
  }

  return {
    ensure(t, silent) {
      const need = Math.floor(t) + METER_WINDOW
      while (history.length < need) push(silent)
    },

    windowAt(tick) {
      const out: MeterSample[] = []
      for (let i = 0; i < METER_WINDOW; i++) {
        out.push(history[tick + i] ?? history[history.length - 1]!)
      }
      return out
    },

    sampleAt,

    smoothSeries(t, points) {
      const out = new Array<number>(points)
      const span = METER_WINDOW - 1
      for (let i = 0; i < points; i++) {
        const s = sampleAt(t + (i / (points - 1)) * span)
        out[i] = Math.max(0.02, s.smooth)
      }
      return out
    },

    compact(t) {
      // Keep a little headroom past the visible window.
      const drop = Math.floor(t) - 2
      if (drop < 64) return 0
      history.splice(0, drop)
      return drop
    },
  }
}
