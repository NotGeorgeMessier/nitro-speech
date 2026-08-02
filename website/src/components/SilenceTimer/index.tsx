import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'

import {
  TIMER_INTERVAL_MAX_MS,
  TIMER_INTERVAL_MIN_MS,
  TIMER_INTERVAL_STEP_MS,
  TIMER_THRESHOLD_MAX_MS,
  TIMER_THRESHOLD_MIN_MS,
  TIMER_THRESHOLD_STEP_MS,
  useDemoSync,
} from '../Phone/DemoSync'
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
  const {
    phraseEpoch,
    timerThresholdMs,
    timerIntervalMs,
    setTimerThresholdMs,
    setTimerIntervalMs,
  } = useDemoSync()
  const [remainingMs, setRemainingMs] = useState(timerThresholdMs)

  useEffect(() => {
    setRemainingMs(timerThresholdMs)

    let id = 0
    const schedule = () => {
      id = window.setTimeout(() => {
        setRemainingMs((r) => Math.max(0, r - timerIntervalMs))
        schedule()
      }, timerIntervalMs)
    }
    schedule()
    return () => window.clearTimeout(id)
  }, [phraseEpoch, timerThresholdMs, timerIntervalMs])

  const progress = Math.max(0, Math.min(1, remainingMs / timerThresholdMs))
  const thresholdSec = Math.round(timerThresholdMs / 1000)

  return (
    <div className={styles.wrap}>
      <Stepper
        label="auto-finish"
        valueLabel={`${thresholdSec}s`}
        onDec={() =>
          setTimerThresholdMs((v) => v - TIMER_THRESHOLD_STEP_MS)
        }
        onInc={() =>
          setTimerThresholdMs((v) => v + TIMER_THRESHOLD_STEP_MS)
        }
        decDisabled={timerThresholdMs <= TIMER_THRESHOLD_MIN_MS}
        incDisabled={timerThresholdMs >= TIMER_THRESHOLD_MAX_MS}
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
        valueLabel={formatInterval(timerIntervalMs)}
        onDec={() => setTimerIntervalMs((v) => v - TIMER_INTERVAL_STEP_MS)}
        onInc={() => setTimerIntervalMs((v) => v + TIMER_INTERVAL_STEP_MS)}
        decDisabled={timerIntervalMs <= TIMER_INTERVAL_MIN_MS}
        incDisabled={timerIntervalMs >= TIMER_INTERVAL_MAX_MS}
        decAria="Decrease progress interval"
        incAria="Increase progress interval"
      />
    </div>
  )
}
