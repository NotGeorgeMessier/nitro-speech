import type {ReactNode, SVGProps} from 'react'

type Props = SVGProps<SVGSVGElement> & {
  /** Evenly spaced language count (tick layout). */
  count: number
  /** Active language index for the bold tick. */
  active: number
  /** Cumulative hand angle (deg) — drives the needle. */
  angle: number
}

/**
 * Instrument bezel: dual rings, language ticks, needle.
 * First-iteration look, without the active sector notch.
 */
export default function DialSvg({
  count,
  active,
  angle,
  ...props
}: Props): ReactNode {
  const ticks = Array.from({length: count}, (_, i) => {
    const a = (i * 360) / count - 90
    const rad = (a * Math.PI) / 180
    const c = Math.cos(rad)
    const s = Math.sin(rad)
    // Rim ticks outside the flag orbit (active flag outer edge ≈ 42.5).
    const outer = 48.4
    const inner = 45
    return {
      key: i,
      x1: 50 + c * inner,
      y1: 50 + s * inner,
      x2: 50 + c * outer,
      y2: 50 + s * outer,
      bold: i === active,
    }
  })

  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
      {/* Inner guide — sits under the flag orbit (outer ring is CSS border). */}
      <circle
        cx="50"
        cy="50"
        r="33"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
        strokeOpacity="0.35"
        strokeDasharray="1.2 2.4"
      />
      {/* Language ticks */}
      {ticks.map((t) => (
        <line
          key={t.key}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="currentColor"
          strokeWidth={t.bold ? 1.8 : 1}
          strokeOpacity={t.bold ? 1 : 0.45}
          strokeLinecap="round"
        />
      ))}
      {/* Needle */}
      <g
        style={{
          transform: `rotate(${angle}deg)`,
          transformOrigin: '50% 50%',
          transition: 'transform 640ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
        <path
          d="M50 18.5 L52.1 50 L50 53.5 L47.9 50 Z"
          fill="currentColor"
        />
        <circle cx="50" cy="50" r="3.1" fill="currentColor" />
        <circle cx="50" cy="50" r="1.35" fill="#faeed2" />
      </g>
    </svg>
  )
}
