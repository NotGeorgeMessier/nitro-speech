import {useEffect, useState} from 'react'

/** How long phrase/chart silence lasts after the trigger phrase. */
export const DEMO_SILENCE_MS = 3000

/**
 * Phone-owned demo sync: phrases and charts share this `silent` flag.
 * Add future cross-feature clocks here (multiple sync channels).
 */
export function useDemoSync() {
  const [silent, setSilent] = useState(false)

  useEffect(() => {
    if (!silent) return
    const id = window.setTimeout(() => setSilent(false), DEMO_SILENCE_MS)
    return () => window.clearTimeout(id)
  }, [silent])

  return {
    silent,
    beginSilence: () => setSilent(true),
  }
}
