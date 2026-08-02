import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react'

import {useDemoSync} from '../Phone/DemoSync'
import Draggable from './Draggable'
import {mountWaveShader} from './waveShader'
import styles from './WavePad.module.css'

type Point = {x: number; y: number}

type Props = {
  style?: CSSProperties
  /** Phone frame center in hero CSS coords (y-down). */
  phoneCenter?: Point | null
}

/**
 * Closest usable approach as a fraction of the default-seat distance.
 * Caps how loud "closer" can get (default seat → ratio 1).
 */
const MIN_DIST_FRAC = 0.55
const VOLUME_RATIO_MIN = 0.15
const VOLUME_RATIO_MAX = 1 / MIN_DIST_FRAC

function cssNumber(v: string | number | undefined): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') return parseFloat(v) || 0
  return 0
}

/**
 * Draggable WebGL wave pad — stage chrome outside the phone.
 * Distance from phone center drives chart volume ratio
 * (1 at default seat; further < 1; closer > 1 up to a min-distance cap).
 */
export default function WavePad({style, phoneCenter}: Props): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<HTMLDivElement>(null)
  const {setVolumeRatio} = useDemoSync()
  const offsetRef = useRef<Point>({x: 0, y: 0})

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handle = mountWaveShader(canvas, {
      onLevel: (level) => {
        padRef.current?.style.setProperty('--pulse', level.toFixed(3))
      },
    })
    return () => handle?.destroy()
  }, [])

  const syncRatio = useCallback(
    (offset: Point) => {
      offsetRef.current = offset
      if (!phoneCenter || !style) return
      const left = cssNumber(style.left)
      const top = cssNumber(style.top)
      const w = cssNumber(style.width)
      const h = cssNumber(style.height)
      const baseCx = left + w * 0.5
      const baseCy = top + h * 0.5
      const base = Math.hypot(baseCx - phoneCenter.x, baseCy - phoneCenter.y)
      if (base <= 0) {
        setVolumeRatio(1)
        return
      }
      const dist = Math.hypot(
        baseCx + offset.x - phoneCenter.x,
        baseCy + offset.y - phoneCenter.y,
      )
      // Min distance ≪ default seat so closer can still raise ratio, but not to ∞.
      const minDist = base * MIN_DIST_FRAC
      const ratio = base / Math.max(dist, minDist)
      setVolumeRatio(
        Math.min(VOLUME_RATIO_MAX, Math.max(VOLUME_RATIO_MIN, ratio)),
      )
    },
    [phoneCenter, style, setVolumeRatio],
  )

  useEffect(() => {
    syncRatio(offsetRef.current)
  }, [syncRatio])

  return (
    <Draggable
      ref={padRef}
      className={styles.wavePad}
      style={style}
      onOffsetChange={syncRatio}>
      <div className={styles.waveClip}>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      </div>
    </Draggable>
  )
}
