import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import {useEffect, useRef, useState, type CSSProperties, type ReactNode} from 'react'

import {useDemoConfig} from '../DemoConfig/DemoConfig'
import Latch from '../Latch'
import Phone, {computePhoneLayoutForFrame, type PhoneLayout} from '../Phone'
import SilenceTimer from '../SilenceTimer'
import Waveform from '../Waveform'
import Worklets from '../Worklets'
import WorldMap from '../WorldMap'
import styles from './Hero.module.css'

/** Permissions latch size token relative to phone frame width. */
const LATCH_SCALE = 0.32

type Props = {
  className?: string
}

/**
 * Hero stage: three columns — map + copy, phone, then latch / meters / worklets.
 * Cross-feature sync / config providers live on the page (shared with the
 * code samples and feature list below).
 */
export default function Hero({className}: Props): ReactNode {
  const {siteConfig} = useDocusaurusContext()
  const {focusFeature} = useDemoConfig()
  const phoneSlotRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<PhoneLayout | null>(null)

  useEffect(() => {
    const slot = phoneSlotRef.current
    if (!slot) return

    const syncLayout = () => {
      const w = slot.clientWidth
      const h = slot.clientHeight
      if (w > 0 && h > 0) setLayout(computePhoneLayoutForFrame(w, h))
    }
    syncLayout()

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(syncLayout)
        : null
    ro?.observe(slot)
    window.addEventListener('resize', syncLayout)

    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', syncLayout)
    }
  }, [])

  const latchStyle: CSSProperties | undefined = layout
    ? ({'--disc': `${layout.frame.width * LATCH_SCALE}px`} as CSSProperties)
    : undefined

  return (
    <div
      className={`${styles.root} ${className ?? ''}`.trim()}
      data-hero-root>
      <div className={styles.row}>
        <div className={styles.left}>
          <WorldMap className={styles.map} />
          <header className={styles.copy}>
            <h1 className={styles.name}>{siteConfig.title}</h1>
            <p className={styles.subtitle}>
              The most{' '}
              <button
                type="button"
                className={styles.subLink}
                onClick={() => focusFeature('speechAnalyzer')}>
                advanced
              </button>{' '}
              and{' '}
              <Link className={styles.subLink} to="/docs/">
                feature-rich
              </Link>{' '}
              real-time Speech Recognition library powered by Nitro Modules
            </p>
          </header>
        </div>
        <div ref={phoneSlotRef} className={styles.phoneSlot}>
          <Phone layout={layout} />
        </div>
        <div className={styles.right}>
          <Latch style={latchStyle} />
          <div className={styles.mid}>
            <Waveform />
            <SilenceTimer />
          </div>
          <Worklets />
        </div>
      </div>
    </div>
  )
}
