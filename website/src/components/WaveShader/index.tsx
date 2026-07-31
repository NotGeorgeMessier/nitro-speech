import {useEffect, useRef, useState, type ReactNode} from 'react'

import Draggable from './Draggable'
import PhonePanel from './PhonePanel'
import {computePhoneLayout, type PhoneLayout} from './phoneLayout'
import {mountWaveShader} from './waveShader'
import styles from './WaveShader.module.css'

type Props = {
  className?: string
}

export default function WaveShader({className}: Props): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<PhoneLayout | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const root = rootRef.current
    if (!canvas || !root) return

    const handle = mountWaveShader(canvas)

    const syncLayout = () => {
      const w = root.clientWidth
      const h = root.clientHeight
      if (w > 0 && h > 0) setLayout(computePhoneLayout(w, h))
    }
    syncLayout()

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(syncLayout)
        : null
    ro?.observe(root)
    window.addEventListener('resize', syncLayout)

    return () => {
      handle?.destroy()
      ro?.disconnect()
      window.removeEventListener('resize', syncLayout)
    }
  }, [])

  return (
    <div ref={rootRef} className={`${styles.root} ${className ?? ''}`.trim()}>
      <Draggable className={styles.waveLayer}>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      </Draggable>
      <PhonePanel layout={layout} />
    </div>
  )
}
