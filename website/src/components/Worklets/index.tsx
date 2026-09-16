import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'

import InfoButton from '../DemoConfig/InfoButton'
import {useDemoConfig} from '../DemoConfig/DemoConfig'
import LockCover from '../LockCover'
import {
  WORKLET_METHODS,
  WORKLET_THREADS,
  type WorkletMethod,
  type WorkletThread,
} from '../DemoConfig/defaults'
import {NsDragSvg} from './nsDragSvg'
import styles from './Worklets.module.css'

const THREAD_LABEL: Record<WorkletThread, string> = {
  ui: 'UI',
  js: 'JS',
  background: 'Background',
}

const THREAD_ARIA: Record<WorkletThread, string> = {
  ui: 'UI runtime',
  js: 'JS runtime',
  background: 'Background runtime',
}

type Drag = {
  method: WorkletMethod
  pointerId: number
  originX: number
  originY: number
  dx: number
  dy: number
  hover: WorkletThread
  moved: boolean
}

type Props = {
  style?: CSSProperties
}

function nextThread(thread: WorkletThread, dir: -1 | 1): WorkletThread {
  const i = WORKLET_THREADS.indexOf(thread)
  return WORKLET_THREADS[Math.min(WORKLET_THREADS.length - 1, Math.max(0, i + dir))]!
}

/**
 * Three runtime lanes; four method chunks in call order.
 * Drag a chunk onto another lane — the Worklets sample follows.
 */
export default function Worklets({style}: Props): ReactNode {
  const {workletPlacement, setWorkletThread, focusFeature} = useDemoConfig()
  const laneRefs = useRef<Partial<Record<WorkletThread, HTMLDivElement | null>>>(
    {},
  )
  const dragRef = useRef<Drag | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [hovering, setHovering] = useState(false)
  const [pointer, setPointer] = useState({x: 0, y: 0})
  const showCursor = drag != null || hovering

  useEffect(() => {
    if (!showCursor) return
    const root = document.documentElement
    const prev = root.style.cursor
    root.style.cursor = 'none'
    return () => {
      root.style.cursor = prev
    }
  }, [showCursor])

  const nearestThread = useCallback((clientY: number): WorkletThread => {
    let best: WorkletThread = 'js'
    let bestDist = Infinity
    for (const thread of WORKLET_THREADS) {
      const el = laneRefs.current[thread]
      if (!el) continue
      const r = el.getBoundingClientRect()
      const dist = Math.abs(clientY - (r.top + r.height * 0.5))
      if (dist < bestDist) {
        bestDist = dist
        best = thread
      }
    }
    return best
  }, [])

  const onPointerEnter = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    setHovering(true)
    setPointer({x: e.clientX, y: e.clientY})
  }, [])

  const onPointerLeave = useCallback(() => {
    if (!dragRef.current) setHovering(false)
  }, [])

  const onPointerDown = useCallback(
    (method: WorkletMethod, e: ReactPointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return
      e.currentTarget.setPointerCapture(e.pointerId)
      setPointer({x: e.clientX, y: e.clientY})
      const next: Drag = {
        method,
        pointerId: e.pointerId,
        originX: e.clientX,
        originY: e.clientY,
        dx: 0,
        dy: 0,
        hover: workletPlacement[method],
        moved: false,
      }
      dragRef.current = next
      setDrag(next)
    },
    [workletPlacement],
  )

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      setPointer({x: e.clientX, y: e.clientY})
      const d = dragRef.current
      if (!d || d.pointerId !== e.pointerId) return
      const dx = e.clientX - d.originX
      const dy = e.clientY - d.originY
      const next: Drag = {
        ...d,
        dx,
        dy,
        hover: nearestThread(e.clientY),
        moved: d.moved || Math.hypot(dx, dy) > 3,
      }
      dragRef.current = next
      setDrag(next)
    },
    [nearestThread],
  )

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      const d = dragRef.current
      dragRef.current = null
      setDrag(null)
      if (!d || d.pointerId !== e.pointerId) return
      const el = e.currentTarget
      const r = el.getBoundingClientRect()
      const inside =
        e.clientX >= r.left &&
        e.clientX < r.right &&
        e.clientY >= r.top &&
        e.clientY < r.bottom
      setHovering(inside)
      if (!d.moved) return
      const thread = nearestThread(e.clientY)
      setWorkletThread(d.method, thread)
      focusFeature('worklets', 'worklets', false)
      e.preventDefault()
      const block = (ev: Event) => {
        ev.preventDefault()
        ev.stopPropagation()
      }
      e.currentTarget.addEventListener('click', block, {
        capture: true,
        once: true,
      })
    },
    [nearestThread, setWorkletThread, focusFeature],
  )

  const onChunkKeyDown = useCallback(
    (method: WorkletMethod, e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
      e.preventDefault()
      const dir = e.key === 'ArrowUp' ? -1 : 1
      const next = nextThread(workletPlacement[method], dir)
      if (next === workletPlacement[method]) return
      setWorkletThread(method, next)
      focusFeature('worklets', 'worklets', false)
    },
    [setWorkletThread, workletPlacement, focusFeature],
  )

  const hot = drag?.hover ?? null

  return (
    <div className={styles.shell} style={style}>
      <div className={styles.infoAbove}>
        <InfoButton featureId="worklets" label="About worklets" />
      </div>
      <div className={styles.wrap}>
        <LockCover label="Show worklet runtimes" />
        <div className={styles.board} role="group" aria-label="Worklet runtimes">
          {WORKLET_THREADS.map((thread) => (
            <div
              key={thread}
              ref={(el) => {
                laneRefs.current[thread] = el
              }}
              className={styles.lane}
              data-thread={thread}
              data-hot={hot === thread ? 'true' : 'false'}>
              <span className={styles.laneTitle}>{THREAD_LABEL[thread]}</span>
              <div className={styles.track}>
                {WORKLET_METHODS.map((method) => {
                  const here = workletPlacement[method] === thread
                  const dragging = drag?.method === method
                  return (
                    <div key={method} className={styles.slot}>
                      {here ? (
                        <button
                          type="button"
                          className={styles.chunk}
                          data-dragging={dragging ? 'true' : 'false'}
                          title={method}
                          style={
                            dragging
                              ? {transform: `translateY(${drag.dy}px)`}
                              : undefined
                          }
                          aria-label={`${method} on ${THREAD_ARIA[thread]}. Drag or press arrow keys to move.`}
                          onPointerEnter={onPointerEnter}
                          onPointerLeave={onPointerLeave}
                          onPointerDown={(e) => onPointerDown(method, e)}
                          onPointerMove={onPointerMove}
                          onPointerUp={onPointerUp}
                          onPointerCancel={onPointerUp}
                          onKeyDown={(e) => onChunkKeyDown(method, e)}>
                          {method}
                        </button>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      {showCursor ? (
        <div
          className={styles.cursor}
          style={{left: pointer.x, top: pointer.y}}
          aria-hidden="true">
          <NsDragSvg className={styles.glyph} />
        </div>
      ) : null}
    </div>
  )
}
