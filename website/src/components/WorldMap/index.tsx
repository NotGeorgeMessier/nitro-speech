import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type SVGProps,
} from 'react'

import {useDemoConfig} from '../DemoConfig/DemoConfig'
import InfoButton from '../DemoConfig/InfoButton'
import {countries, VIEW_HEIGHT, VIEW_WIDTH} from './countries'
import {
  countryIdForLocale,
  flagPieces,
  flagUrl,
  LIVE,
  LOCALES_BY_COUNTRY,
} from './locales'
import {REGION_TABS, regionForCountry, type RegionId} from './regions'
import styles from './WorldMap.module.css'

type Props = {
  className?: string
}

type ViewBox = readonly [number, number, number, number]

function parseViewBox(value: string): ViewBox {
  const [x, y, w, h] = value.split(/[\s,]+/).map(Number)
  return [x ?? 0, y ?? 0, w ?? 0, h ?? 0]
}

/** Fit a region crop into the 800×400 world view (SVG meet). */
function cameraTransform(value: string): string {
  const [vx, vy, vw, vh] = parseViewBox(value)
  const scale = Math.min(VIEW_WIDTH / vw, VIEW_HEIGHT / vh)
  const tx = (VIEW_WIDTH - vw * scale) / 2 - vx * scale
  const ty = (VIEW_HEIGHT - vh * scale) / 2 - vy * scale
  return `translate(${tx}px, ${ty}px) scale(${scale})`
}

/** World-space rect actually shown after meet letterboxing. */
function cameraFrustum(value: string): {
  x: number
  y: number
  width: number
  height: number
} {
  const [vx, vy, vw, vh] = parseViewBox(value)
  const scale = Math.min(VIEW_WIDTH / vw, VIEW_HEIGHT / vh)
  const tx = (VIEW_WIDTH - vw * scale) / 2 - vx * scale
  const ty = (VIEW_HEIGHT - vh * scale) / 2 - vy * scale
  return {
    x: -tx / scale,
    y: -ty / scale,
    width: VIEW_WIDTH / scale,
    height: VIEW_HEIGHT / scale,
  }
}

function reduceMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function CopyGlyph(props: SVGProps<SVGSVGElement>): ReactNode {
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

function CheckGlyph(props: SVGProps<SVGSVGElement>): ReactNode {
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

/** Fetch flagcdn PNGs as blob URLs so they paint inside this SVG. */
function useFlagHrefs(): Record<string, string> {
  const [hrefs, setHrefs] = useState<Record<string, string>>({})
  useEffect(() => {
    let dead = false
    const created: string[] = []
    for (const id of LIVE) {
      fetch(flagUrl(id))
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status))
          return r.blob()
        })
        .then((blob) => {
          if (dead) return
          const href = URL.createObjectURL(blob)
          created.push(href)
          setHrefs((prev) => (prev[id] ? prev : {...prev, [id]: href}))
        })
        .catch(() => {})
    }
    return () => {
      dead = true
      for (const url of created) URL.revokeObjectURL(url)
    }
  }, [])
  return hrefs
}

/**
 * Schematic world — Natural Earth 110m.
 * Phrase roller owns config locale; the map only reads it.
 */
export default function WorldMap({className}: Props): ReactNode {
  const {locale} = useDemoConfig()
  const flags = useFlagHrefs()
  const activeId = countryIdForLocale(locale)
  const [region, setRegion] = useState<RegionId>(
    () => (activeId && regionForCountry(activeId)) || 'na',
  )
  const [picked, setPicked] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [tag, setTag] = useState<string | null>(null)

  const tab = REGION_TABS.find((t) => t.id === region) ?? REGION_TABS[0]!
  const view = cameraFrustum(tab.viewBox)

  const tabsRef = useRef<HTMLDivElement>(null)
  const inkRef = useRef<HTMLSpanElement>(null)
  const inkReady = useRef(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  useEffect(() => {
    if (picked == null) {
      setTag(null)
      return
    }
    const list = LOCALES_BY_COUNTRY[picked] ?? []
    setTag((prev) =>
      prev != null && list.includes(prev)
        ? prev
        : list.includes(locale)
          ? locale
          : (list[0] ?? null),
    )
  }, [picked, locale])

  useLayoutEffect(() => {
    const root = tabsRef.current
    const ink = inkRef.current
    if (root == null || ink == null) return

    const place = (animate: boolean) => {
      const btn = root.querySelector('[aria-selected="true"]')
      if (!(btn instanceof HTMLElement)) return
      ink.style.transition = animate && !reduceMotion() ? '' : 'none'
      ink.style.left = `${btn.offsetLeft}px`
      ink.style.width = `${btn.offsetWidth}px`
    }

    place(inkReady.current)
    inkReady.current = true
    const ro = new ResizeObserver(() => place(false))
    ro.observe(root)
    return () => ro.disconnect()
  }, [region])

  const onCountry = (id: string) => {
    if (!tab.ids.has(id)) return
    setCopied(null)
    setPicked((prev) => (prev === id ? null : id))
  }

  const onRegion = (id: RegionId) => {
    setRegion(id)
    setCopied(null)
    setPicked((prev) => (prev != null && regionForCountry(prev) === id ? prev : null))
  }

  const onCopy = async (next: string) => {
    await navigator.clipboard.writeText(next)
    setCopied(next)
  }

  const pickedCountry = picked
    ? countries.find((c) => c.id === picked)
    : undefined
  const pickedLocales = picked ? (LOCALES_BY_COUNTRY[picked] ?? []) : []
  const shownLocale = tag ?? pickedLocales[0]

  const onPickLocale = (next: string) => {
    setCopied(null)
    setTag(next)
  }

  return (
    <div
      className={`${styles.root} ${className ?? ''}`.trim()}
      data-ready={ready ? 'true' : undefined}>
      <div className={styles.tabbar}>
        <div ref={tabsRef} className={styles.tabs} role="tablist" aria-label="Map region">
          {REGION_TABS.map((item) => {
            const on = item.id === region
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={on}
                className={`${styles.tab}${on ? ` ${styles.tabActive}` : ''}`}
                onClick={() => onRegion(item.id)}>
                {item.label}
              </button>
            )
          })}
          <span ref={inkRef} className={styles.ink} aria-hidden="true" />
        </div>
        <div className={styles.tabInfo}>
          <InfoButton featureId="locale" label="About locale" />
        </div>
      </div>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="img"
        aria-label={tab.label}
        onMouseDown={(event) => event.preventDefault()}>
        <g
          className={styles.camera}
          style={{transform: cameraTransform(tab.viewBox)}}>
          <defs>
            {countries.map((country) => {
              const filled =
                LIVE.has(country.id) &&
                tab.ids.has(country.id) &&
                (country.id === activeId || country.id === picked)
              if (!filled) return null
              return flagPieces(country.d, view).map((piece, i) => (
                <clipPath key={`${country.id}-${i}`} id={`wm-clip-${country.id}-${i}`}>
                  <path d={piece.d} clipRule="nonzero" />
                </clipPath>
              ))
            })}
          </defs>
          {countries.map((country) => {
            const live = LIVE.has(country.id)
            const on = tab.ids.has(country.id)
            const active = country.id === activeId
            const selected = picked === country.id
            const filled = live && on && (active || selected)
            const href = filled ? flags[country.id] : undefined
            return (
              <g
                key={country.id}
                className={styles.country}
                data-on={on ? 'true' : 'false'}
                data-live={live && on ? 'true' : undefined}
                data-active={active && on ? 'true' : undefined}
                data-picked={selected ? 'true' : undefined}>
                <path
                  id={country.id}
                  d={country.d}
                  className={styles.land}
                  aria-label={live && on ? country.name : undefined}
                  onClick={live && on ? () => onCountry(country.id) : undefined}
                />
                {href != null
                  ? flagPieces(country.d, view).map((piece, i) => (
                      <g
                        key={`flag-${country.id}-${i}`}
                        className={styles.layer}
                        clipPath={`url(#wm-clip-${country.id}-${i})`}>
                        <image
                          href={href}
                          x={piece.x}
                          y={piece.y}
                          width={piece.width}
                          height={piece.height}
                          preserveAspectRatio="xMidYMid slice"
                          pointerEvents="none"
                        />
                      </g>
                    ))
                  : null}
                <path d={country.d} className={styles.edge} />
              </g>
            )
          })}
        </g>
      </svg>
      {pickedCountry != null && shownLocale != null ? (
        <div className={styles.sheet} role="status">
          <span className={styles.sheetName}>{pickedCountry.name}</span>
          <ul className={styles.sheetTags}>
            {pickedLocales.map((item) => {
              const on = item === shownLocale
              return (
                <li key={item}>
                  <button
                    type="button"
                    className={styles.sheetTag}
                    data-on={on ? 'true' : undefined}
                    aria-pressed={on}
                    onClick={() => onPickLocale(item)}>
                    {item}
                  </button>
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            className={styles.sheetCopy}
            aria-label={copied === shownLocale ? 'Copied' : `Copy ${shownLocale}`}
            onClick={() => void onCopy(shownLocale)}>
            {copied === shownLocale ? (
              <CheckGlyph className={styles.sheetCopyIcon} />
            ) : (
              <CopyGlyph className={styles.sheetCopyIcon} />
            )}
          </button>
        </div>
      ) : null}
    </div>
  )
}
