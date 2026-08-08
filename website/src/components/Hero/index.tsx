import {useEffect, useRef, useState, type CSSProperties, type ReactNode} from 'react'

import Phone, {computePhoneLayout, type PhoneLayout} from '../Phone'
import LanguageClock from '../LanguageClock'
import Latch from '../Latch'
import SilenceTimer from '../SilenceTimer'
import WavePad from '../WavePad'
import styles from './Hero.module.css'

/** Wave pad edge length relative to phone frame width. */
const WAVE_SCALE = 1.05
/** Permissions latch size token relative to phone frame width. */
const LATCH_SCALE = 0.28

type Props = {
  className?: string
}

/**
 * Hero stage: composes features.
 * Cross-feature sync / config providers live on the page (shared with the
 * code samples and feature list below).
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
        // Centered in the gap between the left edge and the phone.
        const left = Math.max(0, layout.frame.left * 0.5 - size * 0.5)
        return {
          left,
          top: layout.frame.top,
          width: size,
          height: size,
        }
      })()
    : {left: 0, top: 0, width: 1, height: 1, opacity: 0}

  // Cream card docks to the phone's left edge near the start CTA.
  const latchStyle: CSSProperties = layout
    ? (() => {
        const size = layout.frame.width * LATCH_SCALE
        const gap = Math.max(8, layout.frame.width * 0.05)
        const top =
          layout.frame.top + layout.frame.height * 0.62 - size * 0.46
        return {
          left: layout.frame.left - gap,
          top,
          opacity: 1,
          '--disc': `${size}px`,
          transform: 'translateX(-100%)',
        } as CSSProperties
      })()
    : ({
        left: 0,
        top: 0,
        opacity: 0,
        '--disc': '1px',
        transform: 'translateX(-100%)',
      } as CSSProperties)

  const phoneCenter = layout
    ? {
        x: layout.frame.left + layout.frame.width * 0.5,
        y: layout.frame.top + layout.frame.height * 0.5,
      }
    : null

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${className ?? ''}`.trim()}
      data-hero-root>
      <WavePad style={waveStyle} phoneCenter={phoneCenter} />
      {/* Same stacking layer as the phone — above the wave pad. */}
      <div className={styles.foreground}>
        <Phone layout={layout} />
        <Latch style={latchStyle} />
        <SilenceTimer />
        <LanguageClock />
      </div>
    </div>
  )
}
