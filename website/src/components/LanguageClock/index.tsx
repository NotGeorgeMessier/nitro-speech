import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

import InfoCorner from '../DemoConfig/InfoCorner'
import {useDemoConfig} from '../DemoConfig/DemoConfig'
import {LANGUAGE_LOCALES} from '../DemoConfig/defaults'
import {useDemoSync} from '../Phone/DemoSync'
import {languageIndexForPhrase, languages} from '../Phrases/phrases'
import DialSvg from './DialSvg'
import {FlagIcon} from './flags'
import styles from './LanguageClock.module.css'

const LANG_COUNT = languages.length
const STEP = 360 / LANG_COUNT

/**
 * Top-right locale compass — instrument bezel + flags, hand tracks language.
 * Flags seek the phrase feed to that language's first line.
 * Hand always advances clockwise.
 */
export default function LanguageClock(): ReactNode {
  const {phraseIndex, seekToPhrase} = useDemoSync()
  const {setLocale} = useDemoConfig()
  const langIndex = languageIndexForPhrase(phraseIndex)
  const prevLangRef = useRef(langIndex)
  const [handAngle, setHandAngle] = useState(langIndex * STEP)

  useEffect(() => {
    const prev = prevLangRef.current
    if (prev === langIndex) return
    let delta = langIndex - prev
    if (delta <= 0) delta += LANG_COUNT
    setHandAngle((angle) => angle + delta * STEP)
    prevLangRef.current = langIndex
  }, [langIndex])

  // Mirror active language into DemoConfig.locale for live code samples.
  useEffect(() => {
    const lang = languages[langIndex]
    if (!lang) return
    setLocale(LANGUAGE_LOCALES[lang.id])
  }, [langIndex, setLocale])

  return (
    <div className={styles.wrap}>
      <InfoCorner featureId="locale" label="About locale" />
      <DialSvg
        className={styles.dial}
        count={LANG_COUNT}
        active={langIndex}
        angle={handAngle}
      />
      <div className={styles.clock}>
        {languages.map((item, i) => {
          const angle = i * STEP
          const active = i === langIndex
          const orbitStyle: CSSProperties = {
            transform: `translate(-50%, -50%) translateY(calc(-1 * var(--orbit))) rotate(${-angle}deg)`,
          }
          return (
            <div
              key={item.id}
              className={styles.slot}
              style={{transform: `rotate(${angle}deg)`}}>
              <div className={styles.flagOrbit} style={orbitStyle}>
                <button
                  type="button"
                  className={`${styles.flag}${active ? ` ${styles.flagActive}` : ''}`}
                  aria-label={`Jump to ${item.label}`}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => {
                    if (i === langIndex) return
                    setLocale(LANGUAGE_LOCALES[item.id])
                    seekToPhrase(item.start)
                  }}>
                  <FlagIcon id={item.id} className={styles.flagSvg} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
