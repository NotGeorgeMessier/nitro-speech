import type {ReactNode} from 'react'

import type {FeatureId} from './defaults'
import InfoButton from './InfoButton'
import styles from './InfoButton.module.css'

type Props = {
  featureId: FeatureId
  label?: string
  /**
   * `absolute` — overlay top-right (circles); does not affect layout.
   * `head` — in-flow top row, right-aligned (rectangular panels).
   */
  placement?: 'absolute' | 'head'
}

/** Feature [i] — absolute on circles, head row on regular containers. */
export default function InfoCorner({
  featureId,
  label,
  placement = 'absolute',
}: Props): ReactNode {
  if (placement === 'head') {
    return (
      <div className={styles.head}>
        <InfoButton featureId={featureId} label={label} />
      </div>
    )
  }
  return (
    <div className={styles.corner}>
      <InfoButton featureId={featureId} label={label} />
    </div>
  )
}
