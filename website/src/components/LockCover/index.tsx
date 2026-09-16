import {useState, type ReactNode, type SVGProps} from 'react'

import styles from './LockCover.module.css'

type Props = {
  label: string
}

function LockGlyph(props: SVGProps<SVGSVGElement>): ReactNode {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

/** Frosted face over a widget — press once to reveal. */
export default function LockCover({label}: Props): ReactNode {
  const [on, setOn] = useState(true)
  if (!on) return null
  return (
    <button
      type="button"
      className={styles.cover}
      aria-label={label}
      onClick={() => setOn(false)}>
      <LockGlyph className={styles.glyph} />
    </button>
  )
}
