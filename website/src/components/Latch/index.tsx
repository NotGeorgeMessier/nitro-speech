import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react'

import InfoButton from '../DemoConfig/InfoButton'
import {useDemoSync} from '../Phone/DemoSync'
import LockCover from '../LockCover'
import {AndroidSvg} from './AndroidSvg'
import {AppleSvg} from './AppleSvg'
import {CheckSvg} from './CheckSvg'
import {CrossSvg} from './CrossSvg'
import {mountLockShader, type LockShaderHandle} from './lockShader'
import styles from './Latch.module.css'

type Props = {
  style?: CSSProperties
}

/**
 * Connector fill 0..1 between the two step marks.
 * Empty until mic is granted; full once mic (or both) is granted.
 */
function linkProgress(
  locked: boolean,
  grants: {microphone: boolean; speechRecognition: boolean},
): number {
  if (!locked) return 1
  return grants.microphone ? 1 : 0
}

/**
 * Permissions latch — cream card docked to the phone with an ink lock stamp.
 * Lock freezes the demo; unlock runs the iOS permission alert flow on the phone.
 */
export default function Latch({style}: Props): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handleRef = useRef<LockShaderHandle | null>(null)
  const {
    permissionsLocked,
    grants,
    permissionBusy,
    permissionPrompt,
    lockPermissions,
    requestUnlock,
  } = useDemoSync()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handle = mountLockShader(canvas)
    handleRef.current = handle
    handle?.setLocked(false)
    return () => {
      handle?.destroy()
      handleRef.current = null
    }
  }, [])

  useEffect(() => {
    handleRef.current?.setLocked(permissionsLocked)
  }, [permissionsLocked])

  const onPress = () => {
    if (permissionBusy) return
    if (permissionsLocked) requestUnlock()
    else lockPermissions()
  }

  const link = linkProgress(permissionsLocked, grants)

  return (
    <div
      className={styles.shell}
      style={
        {
          ...style,
          '--link': String(link),
          pointerEvents: 'none',
        } as CSSProperties
      }>
      <div className={styles.infoAbove}>
        <InfoButton
          featureId="requestPermission"
          label="About requestPermission"
        />
      </div>
      <button
        type="button"
        className={styles.lock}
        data-locked={permissionsLocked ? 'true' : 'false'}
        data-busy={permissionBusy ? 'true' : 'false'}
        aria-label={
          permissionBusy
            ? 'Permission request in progress'
            : permissionsLocked
              ? 'Permissions locked'
              : 'Permissions unlocked'
        }
        aria-pressed={permissionsLocked}
        aria-disabled={permissionBusy || undefined}
        disabled={permissionBusy}
        onClick={onPress}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </button>
      <div
        className={styles.wrap}
        data-locked={permissionsLocked ? 'true' : 'false'}
        data-busy={permissionBusy ? 'true' : 'false'}
        data-prompt={permissionPrompt ?? undefined}>
        <LockCover label="Show permission status" />
        <span className={styles.sheet} aria-hidden="true">
          <span className={styles.rows}>
            <span
              className={styles.point}
              data-ok={grants.microphone ? 'true' : 'false'}>
              <span className={styles.icons}>
                <AppleSvg className={styles.icon} />
                <AndroidSvg className={styles.icon} />
              </span>
              <span className={styles.label}>Microphone</span>
            </span>
            <span
              className={styles.point}
              data-ok={grants.speechRecognition ? 'true' : 'false'}>
              <span className={styles.icons}>
                <AppleSvg className={styles.icon} />
              </span>
              <span className={styles.label}>Speech recognition</span>
            </span>
          </span>

          {/*
            Fresh stepper: mark → flex link → mark.
            The link is the only rail; it lives in the gap and tucks under marks.
          */}
          <span className={styles.steps}>
            <span
              className={styles.mark}
              data-ok={grants.microphone ? 'true' : 'false'}
              data-active={
                permissionPrompt === 'microphone' && !grants.microphone
                  ? 'true'
                  : 'false'
              }>
              {grants.microphone ? (
                <CheckSvg className={styles.markIcon} />
              ) : (
                <CrossSvg className={styles.markIcon} />
              )}
            </span>

            <span className={styles.link}>
              <span className={styles.linkFill} />
            </span>

            <span
              className={styles.mark}
              data-ok={grants.speechRecognition ? 'true' : 'false'}
              data-active={
                permissionPrompt === 'speechRecognition' &&
                !grants.speechRecognition
                  ? 'true'
                  : 'false'
              }>
              {grants.speechRecognition ? (
                <CheckSvg className={styles.markIcon} />
              ) : (
                <CrossSvg className={styles.markIcon} />
              )}
            </span>
          </span>
        </span>
      </div>
    </div>
  )
}
