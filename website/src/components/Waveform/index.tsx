import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'

import InfoButton from '../DemoConfig/InfoButton'
import {useDemoConfig} from '../DemoConfig/DemoConfig'
import {DEMO_CONFIG_DEFAULTS} from '../DemoConfig/defaults'
import {useDemoSync} from '../Phone/DemoSync'
import styles from './Waveform.module.css'

const BARS = 22
const VB_W = 120
const VB_H = 48
const GAP = 0.34
const HZ_MIN = 80
const HZ_MAX = 8000

/** Same seat / clamp as WavePad. */
const MIN_DIST_FRAC = 0.55
const VOLUME_RATIO_MIN = 0.15
const VOLUME_RATIO_MAX = 1 / MIN_DIST_FRAC

function hzAt(i: number): number {
  const u = i / (BARS - 1)
  return HZ_MIN * (HZ_MAX / HZ_MIN) ** u
}

function peak(hz: number, center: number, q: number): number {
  const d = (hz - center) / q
  return Math.exp(-0.5 * d * d)
}

function burst(phase: number, sharpness: number): number {
  return Math.pow(Math.max(0, Math.sin(phase)), sharpness)
}

/** Syllable hits + short pauses — typical voice-input bounce. */
function speechGate(t: number): number {
  const s1 = burst(t * 16.8, 5)
  const s2 = burst(t * 11.4 + 0.7, 6)
  const s3 = burst(t * 22.1 + 2.2, 8)
  const phrase = 0.3 + 0.7 * Math.max(0, Math.sin(t * 2.6))
  return Math.min(1, (0.2 + s1 + 0.7 * s2 + 0.55 * s3) * phrase)
}

/** Magnitude at a Hz bin. Time only gates / jumps formants — X stays frequency. */
function mag(hz: number, t: number): number {
  const gate = speechGate(t)
  const voiced = burst(t * 9.6 + 0.3, 2)
  const fric = 1 - voiced * 0.85
  const f1 = 420 + 300 * Math.sin(t * 8.8)
  const f2 = 1350 + 520 * Math.sin(t * 11.2 + 0.9)
  const f3 = 2480 + 380 * Math.sin(t * 14.1 + 1.7)
  const body =
    0.5 * peak(hz, 170, 70) +
    0.7 * peak(hz, f1, 200) +
    0.85 * peak(hz, f2, 300) +
    0.4 * peak(hz, f3, 360)
  const hiss = peak(hz, 5400, 1300) * fric
  const jitter = 0.78 + 0.22 * Math.sin(t * 34 + hz * 0.045)
  const raw = gate * (body * (0.35 + 0.65 * voiced) + 0.7 * hiss) * jitter
  return Math.min(1, 0.12 + 0.88 * raw)
}

function clampRatio(ratio: number): number {
  return Math.min(VOLUME_RATIO_MAX, Math.max(VOLUME_RATIO_MIN, ratio))
}

/**
 * Top-right spectrum — synthetic speech bins, Hz on X.
 * Drag vertically: same bind as WavePad (volume ratio + voice sensitivity).
 */
export default function Waveform(): ReactNode {
  const [t, setT] = useState(0)
  const padRef = useRef<HTMLDivElement>(null)
  const {volumeRatio, setVolumeRatio} = useDemoSync()
  const {
    setResetAutoFinishVoiceSensitivity,
    resetEpoch,
    focusFeature,
  } = useDemoConfig()

  const applyRatio = useCallback(
    (ratio: number) => {
      const clamped = clampRatio(ratio)
      setVolumeRatio(clamped)
      setResetAutoFinishVoiceSensitivity(
        DEMO_CONFIG_DEFAULTS.resetAutoFinishVoiceSensitivity * clamped,
      )
    },
    [setVolumeRatio, setResetAutoFinishVoiceSensitivity],
  )

  useEffect(() => {
    applyRatio(1)
  }, [resetEpoch, applyRatio])

  const ratioFromEvent = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = padRef.current
    if (!el) return 1
    const r = el.getBoundingClientRect()
    const u = 1 - (e.clientY - r.top) / Math.max(1, r.height)
    return VOLUME_RATIO_MIN + u * (VOLUME_RATIO_MAX - VOLUME_RATIO_MIN)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    if ((e.target as Element | null)?.closest?.('[data-no-drag]')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    focusFeature('resetAutoFinishVoiceSensitivity', 'live', false)
    applyRatio(ratioFromEvent(e))
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    applyRatio(ratioFromEvent(e))
  }

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      setT(((now - start) / 1000) * 0.72)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const slot = VB_W / BARS
  const bw = slot * (1 - GAP)

  return (
    <div className={styles.root}>
      <div className={styles.infoAbove}>
        <InfoButton
          featureId="resetAutoFinishVoiceSensitivity"
          label="About voice sensitivity"
        />
      </div>
      <div
        ref={padRef}
        className={styles.pad}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Synthetic speech spectrum, frequency on X. Drag vertically to set voice sensitivity.">
          {Array.from({length: BARS}, (_, i) => {
            const h = Math.max(
              VB_H * 0.1,
              Math.min(1, mag(hzAt(i), t) * volumeRatio) * VB_H * 0.96,
            )
            const x = i * slot + (slot - bw) * 0.5
            return (
              <rect
                key={i}
                className={styles.bar}
                x={x}
                y={(VB_H - h) * 0.5}
                width={bw}
                height={h}
                rx={bw * 0.45}
              />
            )
          })}
        </svg>
      </div>
    </div>
  )
}
