import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { VolumeChangeEvent } from './types'

type TSubscriber = () => void

const stateSubscribers = new Set<TSubscriber>()
const isActiveSubscribers = new Set<TSubscriber>()

const EMPTY_VOLUME_EVENT: VolumeChangeEvent = {
  smoothedVolume: 0,
  rawVolume: 0,
  db: undefined,
}

let isActiveEvent = false
let state: VolumeChangeEvent = EMPTY_VOLUME_EVENT

const isActiveSubscribe = (subscriber: TSubscriber) => {
  isActiveSubscribers.add(subscriber)
  return () => isActiveSubscribers.delete(subscriber)
}
const stateSubscribe = (subscriber: TSubscriber) => {
  stateSubscribers.add(subscriber)
  return () => stateSubscribers.delete(subscriber)
}
const noop = () => {
  return () => {}
}

const getIsActive = () => {
  return isActiveEvent
}
const getState = () => {
  return state
}
const getEmpty = () => {
  return EMPTY_VOLUME_EVENT
}

export interface UseVoiceInputVolumeConfig {
  /**
   * The number of volume change events to emit per second.
   *
   * This property does not create more events,
   * it only limits the number of events per second.
   *
   * `undefined` or `X < 0` - no limit, emit every event
   *
   * `0` - disable emitting
   *
   * `0 < X < 1` - Inverts the value extending the window (e.g. `0.5` -> 1 event per 2 seconds)
   *
   * `1 <= X` - emit X events per second (only interger values)
   *
   * @default undefined
   *
   * @max around 4-10 events per second depending on the platform and device.
   */
  eventsPerSecond?: number
}

/**
 * @param config.eventsPerSecond - Controls the frequency of the volume change events.
 *
 * @returns Object with {@linkcode VolumeChangeEvent}
 */
export const useVoiceInputVolume = (config?: UseVoiceInputVolumeConfig) => {
  const eps = config?.eventsPerSecond
  const isActive = useSyncExternalStore(isActiveSubscribe, getIsActive)
  const event = useRef<VolumeChangeEvent>(EMPTY_VOLUME_EVENT)
  const [_, flip] = useState(false)

  const isEPS = typeof eps === 'number' && eps >= 0 && isActive
  const externalStore = useSyncExternalStore(
    isEPS ? noop : stateSubscribe,
    isEPS ? getEmpty : getState
  )

  useEffect(() => {
    if (!isEPS || eps === 0) {
      return
    }

    const interval = Math.max(100, Math.min(60000, Math.round(1000 / eps)))

    const t = setInterval(() => {
      event.current = state
      flip((prev) => !prev)
    }, interval)

    return () => {
      clearInterval(t)
    }
  }, [eps, isEPS])

  if (!isActive || eps === 0) {
    event.current = EMPTY_VOLUME_EVENT
    return EMPTY_VOLUME_EVENT
  }

  if (!isEPS) {
    return externalStore
  }

  if (event.current.rawVolume === 0) {
    event.current = state
  }
  return event.current
}

/**
 * Direct access to default Speech Recognizer volume change handler.
 *
 * In case you use static Speech Recognizer:
 *
 * ```typescript
 * SpeechRecognizer.onVolumeChange = (event) => {
 *  speechRecognizerVolumeChangeHandler(event)
 *  // other logic...
 * }
 * ... // setup everything else
 * SpeechRecognizer.startListening({ locale: 'en-US' })
 * ```
 */
export const speechRecognizerVolumeChangeHandler = (
  event: VolumeChangeEvent
) => {
  const updateActive = event.rawVolume > 0
  if (updateActive !== isActiveEvent) {
    isActiveEvent = updateActive
    isActiveSubscribers.forEach((subscriber) => subscriber())
  }

  event.smoothedVolume = Math.round(event.smoothedVolume * 10000) / 10000
  event.rawVolume = Math.round(event.rawVolume * 10000) / 10000
  event.db = event.db ? Math.round(event.db * 100) / 100 : undefined
  if (event.rawVolume !== state.rawVolume) {
    state = { ...event }
    stateSubscribers.forEach((subscriber) => subscriber())
  }
}
