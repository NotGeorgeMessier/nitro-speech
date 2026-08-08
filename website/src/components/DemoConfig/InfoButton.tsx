import type {ReactNode} from 'react'

import {useDemoConfig} from './DemoConfig'
import type {FeatureId} from './defaults'
import styles from './InfoButton.module.css'

type Props = {
  featureId: FeatureId
  label?: string
}

/** [i] — scrolls to the feature row and highlights code / list. */
export default function InfoButton({
  featureId,
  label = 'About this option',
}: Props): ReactNode {
  const {focusFeature} = useDemoConfig()
  return (
    <button
      type="button"
      className={styles.info}
      data-no-drag
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        focusFeature(featureId)
      }}>
      <svg
        width="40"
        height="40"
        viewBox="-0.1 -0.1 1.2 1.2"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMinYMin"
        aria-hidden="true"
        className={styles.icon}>
        <path
          fill="currentColor"
          d="M.5 1a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m0-.1a.4.4 0 1 0 0-.8.4.4 0 0 0 0 .8m0-.5a.05.05 0 0 1 .05.05V.7a.05.05 0 0 1-.1 0V.45A.05.05 0 0 1 .5.4m0-.05a.05.05 0 1 1 0-.1.05.05 0 0 1 0 .1"
        />
      </svg>
    </button>
  )
}
