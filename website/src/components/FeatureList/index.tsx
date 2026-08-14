import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'

import {useDemoConfig} from '../DemoConfig/DemoConfig'
import type {FeatureId} from '../DemoConfig/defaults'
import {featureListAnchor, FEATURE_ROWS} from '../DemoConfig/features'
import {mountMarkShader, type MarkShaderHandle} from './markShader'
import styles from './FeatureList.module.css'

/** Live WebGL circle — dances on hover; center dot only when pressed. */
function RadioMark({
  alive,
  pressed,
}: {
  alive: boolean
  pressed: boolean
}): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handleRef = useRef<MarkShaderHandle | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handle = mountMarkShader(canvas)
    handleRef.current = handle
    return () => {
      handle?.destroy()
      handleRef.current = null
    }
  }, [])

  useEffect(() => {
    handleRef.current?.setEnergy(alive ? 1 : 0)
  }, [alive])

  useEffect(() => {
    handleRef.current?.setPressed(pressed ? 1 : 0)
  }, [pressed])

  return (
    <span className={styles.markSlot} aria-hidden="true">
      <canvas
        ref={canvasRef}
        className={styles.mark}
        width={48}
        height={48}
      />
    </span>
  )
}

/** True when the event target is (or is inside) a doc/external link. */
function isDocLinkTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('a') != null
}

/** Package differentiators; selecting one focuses it in the code samples. */
export default function FeatureList(): ReactNode {
  const {highlightId, highlightTab, focusFeature} = useDemoConfig()
  const activeAnchor = highlightTab === 'worklets'
    ? 'worklets'
    : highlightId
      ? featureListAnchor(highlightId)
      : null
  const [hoveredId, setHoveredId] = useState<FeatureId | null>(null)

  return (
    <ul className={styles.featureList}>
      {FEATURE_ROWS.map((feature) => {
        const active = activeAnchor === feature.id
        const alive = active || hoveredId === feature.id
        const activate = () => focusFeature(feature.id)
        const onRowClick = (e: MouseEvent<HTMLDivElement>) => {
          // Links navigate on their own; don't also steal focus to the sample.
          if (isDocLinkTarget(e.target)) return
          activate()
        }
        const onRowKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          if (isDocLinkTarget(e.target)) return
          e.preventDefault()
          activate()
        }
        return (
          <li
            key={feature.id}
            className={`${styles.featureRow}${active ? ` ${styles.featureRowActive}` : ''}`}>
            <div
              role="button"
              tabIndex={0}
              className={styles.featureBtn}
              onClick={onRowClick}
              onKeyDown={onRowKeyDown}
              onPointerEnter={() => setHoveredId(feature.id)}
              onPointerLeave={() =>
                setHoveredId((id) => (id === feature.id ? null : id))
              }>
              <RadioMark alive={alive} pressed={active} />
              <span className={styles.featureCopy}>
                <span className={styles.featureTitle}>{feature.row.title}</span>
                <span className={styles.featureBlurb}>{feature.row.blurb}</span>
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
