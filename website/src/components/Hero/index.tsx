import {useEffect, useRef, useState, type CSSProperties, type ReactNode} from 'react'

import Phone, {computePhoneLayout, type PhoneLayout} from '../Phone'
import WavePad from '../WavePad'
import styles from './Hero.module.css'

/** Wave pad edge length relative to phone frame width. */
const WAVE_SCALE = 1.05

type Props = {
  className?: string
}

/**
 * Hero stage: composes independent features.
 * Cross-feature sync (phrases / silence / charts) lives under Phone.
 */
export default function Hero({className}: Props): ReactNode {
  const rootRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<PhoneLayout | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const syncLayout = () => {
      const w = root.clientWidth
      const h = root.clientHeight
      if (w > 0 && h > 0) setLayout(computePhoneLayout(w, h))
    }
    syncLayout()

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(syncLayout)
        : null
    ro?.observe(root)
    window.addEventListener('resize', syncLayout)

    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', syncLayout)
    }
  }, [])

  const waveStyle: CSSProperties = layout
    ? (() => {
        const size = layout.frame.width * WAVE_SCALE
        const inset = Math.max(12, Math.min(layout.cssW, layout.cssH) * 0.03)
        return {
          left: inset,
          top: inset,
          width: size,
          height: size,
        }
      })()
    : {left: 0, top: 0, width: 1, height: 1, opacity: 0}

  return (
    <div ref={rootRef} className={`${styles.root} ${className ?? ''}`.trim()}>
      <WavePad style={waveStyle} />
      <Phone layout={layout} />
    </div>
  )
}
