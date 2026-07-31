import type {ReactNode, SVGProps} from 'react'

import {
  PHONE_ASPECT,
  PHONE_HOME_GAP,
  PHONE_HOME_HY,
  PHONE_ISLAND_GAP,
  PHONE_ISLAND_HY,
} from './phoneLayout'

/** Xcode-style outline iPhone in a normalized viewBox. */
export default function PhoneSvg(props: SVGProps<SVGSVGElement>): ReactNode {
  const W = 100
  const H = W / PHONE_ASPECT
  const stroke = W * 0.0425
  const bodyR = W * 0.18
  const inset = stroke
  const innerW = W - inset * 2
  const innerH = H - inset * 2
  const innerR = Math.max(bodyR - stroke, 0)

  const halfX = W * 0.5
  const islandHy = halfX * PHONE_ISLAND_HY
  const islandHx = halfX * 0.3
  const islandCy = inset + islandHy * PHONE_ISLAND_GAP
  const homeHy = halfX * PHONE_HOME_HY
  const homeHx = halfX * 0.42
  const homeCy = H - inset - homeHy * PHONE_HOME_GAP

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-hidden="true"
      {...props}>
      <rect
        x={stroke * 0.5}
        y={stroke * 0.5}
        width={W - stroke}
        height={H - stroke}
        rx={bodyR}
        ry={bodyR}
        stroke="currentColor"
        strokeWidth={stroke}
      />
      {/* Inner screen edge (subtle) */}
      <rect
        x={inset}
        y={inset}
        width={innerW}
        height={innerH}
        rx={innerR}
        ry={innerR}
        stroke="currentColor"
        strokeWidth={stroke * 0.35}
        opacity={0.35}
      />
      <rect
        x={halfX - islandHx}
        y={islandCy - islandHy}
        width={islandHx * 2}
        height={islandHy * 2}
        rx={islandHy}
        ry={islandHy}
        fill="currentColor"
      />
      <rect
        x={halfX - homeHx}
        y={homeCy - homeHy}
        width={homeHx * 2}
        height={homeHy * 2}
        rx={homeHy}
        ry={homeHy}
        fill="currentColor"
      />
    </svg>
  )
}
