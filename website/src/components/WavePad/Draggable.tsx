import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'

import {DragSvg} from './dragSvg'
import styles from './Draggable.module.css'

type Props = {
  className?: string
  style?: CSSProperties
  children: ReactNode
}

/** Pointer-drag wrapper; suppresses click if the pointer moved. */
const Draggable = forwardRef<HTMLDivElement, Props>(function Draggable(
  {className, style, children},
  ref,
): ReactNode {
  const [pos, setPos] = useState({x: 0, y: 0})
  const [dragging, setDragging] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [pointer, setPointer] = useState({x: 0, y: 0})
  const drag = useRef<{
    pid: number
    x0: number
    y0: number
    ox: number
    oy: number
    moved: boolean
  } | null>(null)

  const showCursor = dragging || hovering

  useEffect(() => {
    if (!showCursor) return
    const root = document.documentElement
    const prev = root.style.cursor
    root.style.cursor = 'none'
    return () => {
      root.style.cursor = prev
    }
  }, [showCursor])

  const onPointerEnter = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    setHovering(true)
    setPointer({x: e.clientX, y: e.clientY})
  }, [])

  const onPointerLeave = useCallback(() => {
    if (!drag.current) setHovering(false)
  }, [])

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      // Let interactive children (e.g. Start) handle the pointer.
      if ((e.target as Element | null)?.closest?.('[data-no-drag]')) return
      e.currentTarget.setPointerCapture(e.pointerId)
      drag.current = {
        pid: e.pointerId,
        x0: e.clientX,
        y0: e.clientY,
        ox: pos.x,
        oy: pos.y,
        moved: false,
      }
      setPointer({x: e.clientX, y: e.clientY})
      setDragging(true)
    },
    [pos.x, pos.y],
  )

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    setPointer({x: e.clientX, y: e.clientY})
    const d = drag.current
    if (!d || d.pid !== e.pointerId) return
    const dx = e.clientX - d.x0
    const dy = e.clientY - d.y0
    if (Math.hypot(dx, dy) > 3) d.moved = true
    setPos({x: d.ox + dx, y: d.oy + dy})
  }, [])

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.pid !== e.pointerId) return
    if (d.moved) {
      e.preventDefault()
      const block = (ev: Event) => {
        ev.preventDefault()
        ev.stopPropagation()
      }
      e.currentTarget.addEventListener('click', block, {
        capture: true,
        once: true,
      })
    }
    drag.current = null
    setDragging(false)
    // Pointer may have left the layer while captured.
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const inside =
      e.clientX >= r.left &&
      e.clientX < r.right &&
      e.clientY >= r.top &&
      e.clientY < r.bottom
    setHovering(inside)
  }, [])

  return (
    <>
      <div
        ref={ref}
        className={className}
        style={{
          ...style,
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
          touchAction: 'none',
          cursor: 'none',
        }}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}>
        {children}
      </div>
      {showCursor ? (
        <div
          className={styles.cursor}
          style={{left: pointer.x, top: pointer.y}}
          aria-hidden="true">
          <DragSvg className={styles.glyph} />
        </div>
      ) : null}
    </>
  )
})

export default Draggable
