import {useEffect, useRef, type CSSProperties, type ReactNode} from 'react'

import Draggable from './Draggable'
import {mountWaveShader} from './waveShader'
import styles from './WavePad.module.css'

type Props = {
  style?: CSSProperties
}

/** Draggable WebGL wave pad — stage chrome outside the phone. */
export default function WavePad({style}: Props): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handle = mountWaveShader(canvas, {
      onLevel: (level) => {
        padRef.current?.style.setProperty('--pulse', level.toFixed(3))
      },
    })
    return () => handle?.destroy()
  }, [])

  return (
    <Draggable ref={padRef} className={styles.wavePad} style={style}>
      <div className={styles.waveClip}>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      </div>
    </Draggable>
  )
}
