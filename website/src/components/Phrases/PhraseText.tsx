import type {ReactNode} from 'react'

import {useDemoConfig} from '../DemoConfig/DemoConfig'
import styles from './PhraseFeed.module.css'

const MASK_WORD = 'fucking'
const MASK_DISPLAY = '*******'
const MASK_RE = new RegExp(`\\b${MASK_WORD}\\b`, 'i')

/** Renders a phrase; underlined offensive word toggles maskOffensiveWords. */
export default function PhraseText({text}: {text: string}): ReactNode {
  const {maskOffensiveWords, toggleMaskOffensiveWords} = useDemoConfig()
  const match = MASK_RE.exec(text)
  if (!match || match.index === undefined) return text

  const start = match.index
  const end = start + match[0].length
  const before = text.slice(0, start)
  const after = text.slice(end)
  const shown = maskOffensiveWords ? MASK_DISPLAY : MASK_WORD

  return (
    <>
      {before}
      <button
        type="button"
        className={styles.maskToggle}
        data-no-drag
        aria-pressed={!maskOffensiveWords}
        aria-label={
          maskOffensiveWords
            ? 'Show masked word (maskOffensiveWords off)'
            : 'Hide word (maskOffensiveWords on)'
        }
        onClick={(e) => {
          e.stopPropagation()
          toggleMaskOffensiveWords()
        }}>
        {shown}
      </button>
      {after}
    </>
  )
}
