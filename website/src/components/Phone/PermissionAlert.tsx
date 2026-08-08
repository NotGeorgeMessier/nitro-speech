import type {CSSProperties, ReactNode} from 'react'

import {
  useDemoSync,
  type PermissionKind,
} from './DemoSync'
import styles from './PermissionAlert.module.css'

const COPY: Record<
  PermissionKind,
  {title: string; message: string}
> = {
  microphone: {
    title: '“Nitro Speech” Would Like to Access the Microphone',
    message: 'This app needs microphone access for speech recognition',
  },
  speechRecognition: {
    title: '“Nitro Speech” Would Like to Access Speech Recognition',
    message: 'This app needs speech recognition to convert speech to text',
  },
}

type Props = {
  /** Full glass rect — dims island + home bands with the content. */
  style: CSSProperties
}

/** iOS-style permission sheet over the phone glass. */
export default function PermissionAlert({style}: Props): ReactNode {
  const {
    permissionPrompt,
    allowPermission,
    denyPermission,
  } = useDemoSync()

  if (!permissionPrompt) return null

  const copy = COPY[permissionPrompt]

  return (
    <div
      className={styles.scrim}
      style={style}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="permission-alert-title"
      aria-describedby="permission-alert-message"
      data-permission-alert={permissionPrompt}>
      <div className={styles.card}>
        <div className={styles.body}>
          <p id="permission-alert-title" className={styles.title}>
            {copy.title}
          </p>
          <p id="permission-alert-message" className={styles.message}>
            {copy.message}
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.action} ${styles.deny}`}
            onClick={denyPermission}>
            Don&apos;t Allow
          </button>
          <button
            type="button"
            className={`${styles.action} ${styles.allow}`}
            onClick={allowPermission}>
            Allow
          </button>
        </div>
      </div>
    </div>
  )
}
