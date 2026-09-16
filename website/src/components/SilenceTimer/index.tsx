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
import LockCover from '../LockCover'
import {
  TIMER_INTERVAL_MAX_MS,
  TIMER_INTERVAL_MIN_MS,
  TIMER_INTERVAL_STEP_MS,
  TIMER_THRESHOLD_MAX_MS,
  TIMER_THRESHOLD_MIN_MS,
  TIMER_THRESHOLD_STEP_MS,
} from '../DemoConfig/defaults'
import {useDemoSync} from '../Phone/DemoSync'
import {ArrowRightSvg} from './ArrowRightSvg'
import styles from './SilenceTimer.module.css'

const HOLD_DELAY_MS = 320
const HOLD_REPEAT_MS = 70

function formatInterval(ms: number): string {
  if (ms >= 1000 && ms % 1000 === 0) return `${ms / 1000}s`
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
  return `${ms}ms`
}

/** Click once; hold to keep stepping. */
function useHoldRepeat(action: () => void, disabled: boolean) {
  const actionRef = useRef(action)
  actionRef.current = action
  const delayRef = useRef(0)
  const repeatRef = useRef(0)

  const stop = useCallback(() => {
    window.clearTimeout(delayRef.current)
    window.clearInterval(repeatRef.current)
    delayRef.current = 0
    repeatRef.current = 0
  }, [])

  useEffect(() => {
    if (disabled) stop()
  }, [disabled, stop])

  useEffect(() => () => stop(), [stop])

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (disabled || e.button !== 0) return
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      actionRef.current()
      delayRef.current = window.setTimeout(() => {
        repeatRef.current = window.setInterval(() => {
          actionRef.current()
        }, HOLD_REPEAT_MS)
      }, HOLD_DELAY_MS)
    },
    [disabled],
  )

  return {
    onPointerDown,
    onPointerUp: stop,
    onPointerCancel: stop,
    onLostPointerCapture: stop,
  }
}

type HoldStepProps = {
  className?: string
  onStep: () => void
  disabled: boolean
  ariaLabel: string
}

function HoldStep({
  className,
  onStep,
  disabled,
  ariaLabel,
}: HoldStepProps): ReactNode {
  const hold = useHoldRepeat(onStep, disabled)
  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      aria-label={ariaLabel}
      {...hold}>
      <ArrowRightSvg className={styles.arrow} />
    </button>
  )
}

type StepperProps = {
  label: string
  valueLabel: string
  onDec: () => void
  onInc: () => void
  decDisabled: boolean
  incDisabled: boolean
  decAria: string
  incAria: string
}

function Stepper({
  label,
  valueLabel,
  onDec,
  onInc,
  decDisabled,
  incDisabled,
  decAria,
  incAria,
}: StepperProps): ReactNode {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <div className={styles.stepper}>
        <HoldStep
          className={`${styles.step} ${styles.stepPrev}`}
          onStep={onDec}
          disabled={decDisabled}
          ariaLabel={decAria}
        />
        <span className={styles.value}>{valueLabel}</span>
        <HoldStep
          className={styles.step}
          onStep={onInc}
          disabled={incDisabled}
          ariaLabel={incAria}
        />
      </div>
    </div>
  )
}

/**
 * Casual auto-finish timer progress (hero chrome).
 * Resets on each phrase; steps down every interval — including during feed silence.
 */
export default function SilenceTimer(): ReactNode {
  const {phraseEpoch, permissionsLocked} = useDemoSync()
  const {
    autoFinishRecognitionMs,
    autoFinishProgressIntervalMs,
    setAutoFinishRecognitionMs,
    setAutoFinishProgressIntervalMs,
  } = useDemoConfig()
  const [remainingMs, setRemainingMs] = useState(autoFinishRecognitionMs)

  useEffect(() => {
    setRemainingMs(autoFinishRecognitionMs)

    // Pause countdown while permissions are locked; steppers stay live.
    if (permissionsLocked) return

    let id = 0
    const schedule = () => {
      id = window.setTimeout(() => {
        setRemainingMs((r) => Math.max(0, r - autoFinishProgressIntervalMs))
        schedule()
      }, autoFinishProgressIntervalMs)
    }
    schedule()
    return () => window.clearTimeout(id)
  }, [
    phraseEpoch,
    autoFinishRecognitionMs,
    autoFinishProgressIntervalMs,
    permissionsLocked,
  ])

  const progress = Math.max(
    0,
    Math.min(1, remainingMs / autoFinishRecognitionMs),
  )
  const thresholdSec = Math.round(autoFinishRecognitionMs / 1000)

  return (
    <div
      className={styles.wrap}
      data-disabled={permissionsLocked ? 'true' : 'false'}>
      <div className={styles.infoAbove}>
        <InfoButton
          featureId="autoFinishRecognitionMs"
          label="About auto-finish silence timer"
        />
      </div>
      <LockCover label="Show silence timer" />
      <Stepper
        label="auto-finish"
        valueLabel={`${thresholdSec}s`}
        onDec={() =>
          setAutoFinishRecognitionMs((v) => v - TIMER_THRESHOLD_STEP_MS)
        }
        onInc={() =>
          setAutoFinishRecognitionMs((v) => v + TIMER_THRESHOLD_STEP_MS)
        }
        decDisabled={autoFinishRecognitionMs <= TIMER_THRESHOLD_MIN_MS}
        incDisabled={autoFinishRecognitionMs >= TIMER_THRESHOLD_MAX_MS}
        decAria="Decrease auto-finish timer"
        incAria="Increase auto-finish timer"
      />
      <div className={styles.track} aria-hidden="true">
        <div
          className={styles.fill}
          style={{transform: `scaleX(${progress})`}}
        />
      </div>
      <Stepper
        label="interval"
        valueLabel={formatInterval(autoFinishProgressIntervalMs)}
        onDec={() =>
          setAutoFinishProgressIntervalMs((v) => v - TIMER_INTERVAL_STEP_MS)
        }
        onInc={() =>
          setAutoFinishProgressIntervalMs((v) => v + TIMER_INTERVAL_STEP_MS)
        }
        decDisabled={autoFinishProgressIntervalMs <= TIMER_INTERVAL_MIN_MS}
        incDisabled={autoFinishProgressIntervalMs >= TIMER_INTERVAL_MAX_MS}
        decAria="Decrease progress interval"
        incAria="Increase progress interval"
      />
    </div>
  )
}
