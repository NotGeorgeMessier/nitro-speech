import Link from '@docusaurus/Link'
import {useCallback, type CSSProperties, type ReactNode} from 'react'

import MeterCharts from '../Charts'
import {useDemoConfig} from '../DemoConfig/DemoConfig'
import {LANGUAGE_LOCALES} from '../DemoConfig/defaults'
import PhraseFeed from '../Phrases'
import {languageIndexForPhrase, languages} from '../Phrases/phrases'
import {useDemoSync} from './DemoSync'
import {MicroSvg} from './MicroSvg'
import PermissionAlert from './PermissionAlert'
import type {PhoneLayout} from './phoneLayout'
import PhoneSvg from './PhoneSvg'
import styles from './Phone.module.css'

type Props = {
  layout: PhoneLayout | null
}

/**
 * Gravity center for hero features that share demo timing
 * (phrases ↔ silence ↔ charts ↔ silence timer ↔ permissions).
 */
export default function Phone({layout}: Props): ReactNode {
  const {silent, beginSilence, notifyPhrase, permissionsLocked} = useDemoSync()
  const {setLocale} = useDemoConfig()
  const onPhrase = useCallback(
    (index: number) => {
      notifyPhrase(index)
      const lang = languages[languageIndexForPhrase(index)]
      if (lang != null) setLocale(LANGUAGE_LOCALES[lang.id])
    },
    [notifyPhrase, setLocale],
  )

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

  // Dim the full glass (island + home bands), not only the clear screen.
  const alertStyle: CSSProperties = glassStyle

  return (
    <div className={styles.phone} style={phoneStyle}>
      <div className={styles.glass} style={glassStyle} />
      <div className={styles.screen} style={screenStyle}>
        <MeterCharts silent={silent} frozen={permissionsLocked} />
        <div className={styles.bottom}>
          <PhraseFeed
            layout={layout}
            silent={silent}
            frozen={permissionsLocked}
            onPhrase={onPhrase}
            onSilenceRequest={beginSilence}
          />
          <Link className={styles.start} to="/docs/">
            <MicroSvg className={styles.mic} />
            <span>Get started</span>
          </Link>
        </div>
      </div>
      <PermissionAlert style={alertStyle} />
      <PhoneSvg className={styles.chrome} />
    </div>
  )
}

export type {PhoneLayout} from './phoneLayout'
export {computePhoneLayout, computePhoneLayoutForFrame} from './phoneLayout'
export {DemoSyncProvider, useDemoSync} from './DemoSync'
