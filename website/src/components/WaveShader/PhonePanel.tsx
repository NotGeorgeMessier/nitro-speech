import Link from '@docusaurus/Link'
import type {CSSProperties, ReactNode} from 'react'

import MeterCharts from './MeterCharts'
import {MicroSvg} from './microSvg'
import type {PhoneLayout} from './phoneLayout'
import PhoneSvg from './PhoneSvg'
import PhraseFeed from './PhraseFeed'
import styles from './PhonePanel.module.css'

type Props = {
  layout: PhoneLayout | null
}

export default function PhonePanel({layout}: Props): ReactNode {
  if (!layout) return null

  const {frame, inner, screen} = layout

  const phoneStyle: CSSProperties = {
    left: frame.left,
    top: frame.top,
    width: frame.width,
    height: frame.height,
  }

  const glassStyle: CSSProperties = {
    left: inner.left - frame.left,
    top: inner.top - frame.top,
    width: inner.width,
    height: inner.height,
    borderRadius: Math.min(inner.width, inner.height) * 0.18,
  }

  const screenStyle: CSSProperties = {
    left: screen.left - frame.left,
    top: screen.top - frame.top,
    width: screen.width,
    height: screen.height,
  }

  return (
    <div className={styles.phone} style={phoneStyle}>
      <div className={styles.glass} style={glassStyle} />
      <PhoneSvg className={styles.chrome} />
      <div className={styles.screen} style={screenStyle}>
        <MeterCharts />
        <div className={styles.bottom}>
          <PhraseFeed layout={layout} />
          <Link className={styles.start} to="/docs/">
            <MicroSvg className={styles.mic} />
            <span>Start</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
