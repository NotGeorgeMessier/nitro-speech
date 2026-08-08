import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

/** How long phrase/chart silence lasts after the trigger phrase. */
const DEMO_SILENCE_MS = 3500

/** Flip on to restore phrase/chart silence breaks. */
const DEMO_SILENCE_ENABLED = true

/** Beat between mic allow → speech alert. */
const NEXT_PROMPT_MS = 520

export type PermissionKind = 'microphone' | 'speechRecognition'

export type PermissionGrants = {
  microphone: boolean
  speechRecognition: boolean
}

type DemoSyncValue = {
  /** Charts / phrase feed pause while true. */
  silent: boolean
  beginSilence: () => void
  /** Bump when a phrase row is rendered — resets the silence timer. */
  notifyPhrase: (phraseIndex: number) => void
  phraseEpoch: number
  /** Latest phrase index in the demo loop (for language clock, etc.). */
  phraseIndex: number
  /** Bumps when a language flag requests a scrub to a phrase index. */
  seekEpoch: number
  /** Target phrase index for the active seek (language block start). */
  seekPhraseIndex: number
  /** Scrub the phrase feed forward to this index (skips silence). */
  seekToPhrase: (phraseIndex: number) => void
  /**
   * Mic distance volume (1 = default wave position).
   * Closer → >1, further → <1. Applied to newly pushed chart samples only.
   * Game only — API binding for WavePad is resetAutoFinishVoiceSensitivity.
   */
  volumeRatio: number
  setVolumeRatio: (ratio: number) => void

  /** Permissions locked — freeze charts/phrases; dim timer. */
  permissionsLocked: boolean
  grants: PermissionGrants
  /** Active iOS-style prompt on the phone, or null. */
  permissionPrompt: PermissionKind | null
  /** Latch blocked while a prompt is open / transitioning. */
  permissionBusy: boolean
  lockPermissions: () => void
  requestUnlock: () => void
  allowPermission: () => void
  denyPermission: () => void
}

const DemoSyncContext = createContext<DemoSyncValue | null>(null)

/**
 * Hero-wide demo sync (owned by Phone domain).
 * Wrap features that share phrase / silence / timer / permission timing.
 * API-shaped config lives in DemoConfigProvider.
 */
export function DemoSyncProvider({children}: {children: ReactNode}): ReactNode {
  const [silent, setSilent] = useState(false)
  const [phraseEpoch, setPhraseEpoch] = useState(0)
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [seekEpoch, setSeekEpoch] = useState(0)
  const [seekPhraseIndex, setSeekPhraseIndex] = useState(0)
  const [volumeRatio, setVolumeRatioRaw] = useState(1)

  // Start unlocked — both lines checked.
  const [permissionsLocked, setPermissionsLocked] = useState(false)
  const [grants, setGrants] = useState<PermissionGrants>({
    microphone: true,
    speechRecognition: true,
  })
  const [permissionPrompt, setPermissionPrompt] =
    useState<PermissionKind | null>(null)
  const [permissionBusy, setPermissionBusy] = useState(false)
  const nextPromptTimer = useRef(0)

  useEffect(() => {
    if (!silent) return
    const id = window.setTimeout(() => setSilent(false), DEMO_SILENCE_MS)
    return () => window.clearTimeout(id)
  }, [silent])

  useEffect(
    () => () => window.clearTimeout(nextPromptTimer.current),
    [],
  )

  const beginSilence = useCallback(() => {
    if (!DEMO_SILENCE_ENABLED) return
    if (permissionsLocked) return
    setSilent(true)
  }, [permissionsLocked])

  const notifyPhrase = useCallback((index: number) => {
    setPhraseIndex(index)
    setPhraseEpoch((n) => n + 1)
  }, [])

  const seekToPhrase = useCallback((index: number) => {
    setSilent(false)
    setSeekPhraseIndex(index)
    setSeekEpoch((n) => n + 1)
  }, [])

  const setVolumeRatio = useCallback((ratio: number) => {
    setVolumeRatioRaw(Math.min(2, Math.max(0.15, ratio)))
  }, [])

  const lockPermissions = useCallback(() => {
    window.clearTimeout(nextPromptTimer.current)
    setPermissionsLocked(true)
    setGrants({microphone: false, speechRecognition: false})
    setPermissionPrompt(null)
    setPermissionBusy(false)
  }, [])

  const requestUnlock = useCallback(() => {
    if (!permissionsLocked || permissionBusy) return
    setPermissionBusy(true)
    // Resume at speech if mic was already granted in a prior attempt.
    if (grants.microphone && !grants.speechRecognition) {
      setPermissionPrompt('speechRecognition')
      return
    }
    setPermissionPrompt('microphone')
  }, [permissionsLocked, permissionBusy, grants])

  const allowPermission = useCallback(() => {
    if (!permissionPrompt || !permissionBusy) return
    const kind = permissionPrompt

    if (kind === 'microphone') {
      setGrants((g) => ({...g, microphone: true}))
      setPermissionPrompt(null)
      window.clearTimeout(nextPromptTimer.current)
      nextPromptTimer.current = window.setTimeout(() => {
        setPermissionPrompt('speechRecognition')
      }, NEXT_PROMPT_MS)
      return
    }

    // Speech allowed — both grants complete → unlock + resume.
    setGrants({microphone: true, speechRecognition: true})
    setPermissionPrompt(null)
    setPermissionBusy(false)
    setPermissionsLocked(false)
  }, [permissionPrompt, permissionBusy])

  const denyPermission = useCallback(() => {
    if (!permissionPrompt || !permissionBusy) return
    const kind = permissionPrompt
    window.clearTimeout(nextPromptTimer.current)
    setPermissionPrompt(null)
    setPermissionBusy(false)
    // Stay locked. Mic may already be checked if speech was denied.
    if (kind === 'microphone') {
      setGrants({microphone: false, speechRecognition: false})
    } else {
      setGrants((g) => ({...g, speechRecognition: false}))
    }
  }, [permissionPrompt, permissionBusy])

  const value = useMemo(
    () => ({
      silent,
      beginSilence,
      notifyPhrase,
      phraseEpoch,
      phraseIndex,
      seekEpoch,
      seekPhraseIndex,
      seekToPhrase,
      volumeRatio,
      setVolumeRatio,
      permissionsLocked,
      grants,
      permissionPrompt,
      permissionBusy,
      lockPermissions,
      requestUnlock,
      allowPermission,
      denyPermission,
    }),
    [
      silent,
      beginSilence,
      notifyPhrase,
      phraseEpoch,
      phraseIndex,
      seekEpoch,
      seekPhraseIndex,
      seekToPhrase,
      volumeRatio,
      setVolumeRatio,
      permissionsLocked,
      grants,
      permissionPrompt,
      permissionBusy,
      lockPermissions,
      requestUnlock,
      allowPermission,
      denyPermission,
    ],
  )

  return (
    <DemoSyncContext.Provider value={value}>{children}</DemoSyncContext.Provider>
  )
}

export function useDemoSync(): DemoSyncValue {
  const ctx = useContext(DemoSyncContext)
  if (!ctx) {
    throw new Error('useDemoSync must be used within DemoSyncProvider')
  }
  return ctx
}
