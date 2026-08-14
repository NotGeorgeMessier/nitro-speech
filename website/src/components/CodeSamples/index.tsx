import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type SVGProps,
} from 'react'

import {useDemoConfig} from '../DemoConfig/DemoConfig'
import type {FeatureId} from '../DemoConfig/defaults'
import {featureHighlightIds, featureTab} from '../DemoConfig/features'
import {
  buildSamples,
  CODE_TABS,
  parseMarkers,
  stripMarkers,
  type CodeTabId,
} from './samples'
import styles from './CodeSamples.module.css'

/** Clipboard / copy glyph for the code toolbar. */
function CopySvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

/** Brief confirmation after copy. */
function CheckSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function MarkedCode({
  source,
  highlightId,
}: {
  source: string
  highlightId: FeatureId | null
}): ReactNode {
  const activeIds = highlightId
    ? new Set(featureHighlightIds(highlightId))
    : null

  return (
    <code>
      {parseMarkers(source).map((token, i) => {
        if (token.featureId == null) return token.text
        const active = activeIds?.has(token.featureId) ?? false
        return (
          <span
            key={i}
            className={`${styles.codeMark}${active ? ` ${styles.codeMarkActive}` : ''}`}>
            {token.text}
          </span>
        )
      })}
    </code>
  )
}

/** Tabbed, copyable code samples that track the live demo config. */
export default function CodeSamples(): ReactNode {
  const config = useDemoConfig()
  const [tab, setTab] = useState<CodeTabId>('quickstart')
  const [copied, setCopied] = useState(false)

  const samples = useMemo(
    () =>
      buildSamples({
        locale: config.locale,
        maskOffensiveWords: config.maskOffensiveWords,
        autoFinishRecognitionMs: config.autoFinishRecognitionMs,
        autoFinishProgressIntervalMs: config.autoFinishProgressIntervalMs,
        resetAutoFinishVoiceSensitivity: config.resetAutoFinishVoiceSensitivity,
        workletPlacement: config.workletPlacement,
        dirty: config.dirty,
      }),
    [
      config.locale,
      config.maskOffensiveWords,
      config.autoFinishRecognitionMs,
      config.autoFinishProgressIntervalMs,
      config.resetAutoFinishVoiceSensitivity,
      config.workletPlacement,
      config.dirty,
    ],
  )

  useEffect(() => {
    if (!config.highlightId) return
    const next = config.highlightTab ?? featureTab(config.highlightId)
    if (next) setTab(next)
  }, [config.highlightEpoch, config.highlightId, config.highlightTab])

  const source = samples[tab] ?? ''

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(stripMarkers(source))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className={styles.codePanel}>
      <div className={styles.tabsHeader}>
        <div className={styles.tabs} role="tablist" aria-label="Code samples">
          {CODE_TABS.map((t) => {
            const selected = t.id === tab
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`${styles.tab}${selected ? ` ${styles.tabActive}` : ''}`}
                onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          className={styles.toolBtn}
          onClick={config.resetConfig}>
          Reset config
        </button>
      </div>
      <div className={styles.codeBody}>
        <button
          type="button"
          className={styles.copyBtn}
          onClick={onCopy}
          aria-label={copied ? 'Copied' : 'Copy code'}>
          {copied ? (
            <CheckSvg className={styles.toolIcon} />
          ) : (
            <CopySvg className={styles.toolIcon} />
          )}
        </button>
        <pre className={styles.code} role="tabpanel">
          <MarkedCode source={source} highlightId={config.highlightId} />
        </pre>
      </div>
    </div>
  )
}
