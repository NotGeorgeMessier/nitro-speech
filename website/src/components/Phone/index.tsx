import Link from '@docusaurus/Link'
import type {CSSProperties, ReactNode} from 'react'

import MeterCharts from '../Charts'
import PhraseFeed from '../Phrases'
import {useDemoSync} from './DemoSync'
import {MicroSvg} from './MicroSvg'
import type {PhoneLayout} from './phoneLayout'
import PhoneSvg from './PhoneSvg'
import styles from './Phone.module.css'

type Props = {
  layout: PhoneLayout | null
}

/**
 * Gravity center for hero features that share demo timing
 * (phrases ↔ silence ↔ charts ↔ silence timer).
 */
export default function Phone({layout}: Props): ReactNode {
  const {silent, beginSilence, notifyPhrase} = useDemoSync()

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
        <MeterCharts silent={silent} />
        <div className={styles.bottom}>
          <PhraseFeed
            layout={layout}
            silent={silent}
            onPhrase={notifyPhrase}
            onSilenceRequest={beginSilence}
          />
          <Link className={styles.start} to="/docs/">
            <MicroSvg className={styles.mic} />
            <span>Get started</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export type {PhoneLayout} from './phoneLayout'
export {computePhoneLayout} from './phoneLayout'
export {DemoSyncProvider, useDemoSync} from './DemoSync'
