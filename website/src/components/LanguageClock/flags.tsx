import type {SVGProps, ReactNode} from 'react'

import type {LanguageId} from '../Phrases/phrases'

type FlagProps = SVGProps<SVGSVGElement>

/** Compact circular flag glyphs for the language clock. */
export function FlagIcon({
  id,
  ...props
}: FlagProps & {id: LanguageId}): ReactNode {
  switch (id) {
    case 'en':
      return <FlagEN {...props} />
    case 'es':
      return <FlagES {...props} />
    case 'fr':
      return <FlagFR {...props} />
    case 'de':
      return <FlagDE {...props} />
    case 'pl':
      return <FlagPL {...props} />
    case 'ja':
      return <FlagJP {...props} />
    case 'zh':
      return <FlagCN {...props} />
  }
}

/** England — St George's Cross (not Union Jack). */
function FlagEN(props: FlagProps): ReactNode {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <circle cx="16" cy="16" r="16" fill="#fff" />
      <path fill="#CE1124" d="M13 0h6v32h-6zM0 13h32v6H0z" />
    </svg>
  )
}

function FlagES(props: FlagProps): ReactNode {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <circle cx="16" cy="16" r="16" fill="#C60B1E" />
      <path fill="#FFC400" d="M0 10h32v12H0z" />
    </svg>
  )
}

function FlagFR(props: FlagProps): ReactNode {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <circle cx="16" cy="16" r="16" fill="#fff" />
      <path fill="#002395" d="M0 0h10.7v32H0z" />
      <path fill="#ED2939" d="M21.3 0H32v32H21.3z" />
    </svg>
  )
}

function FlagDE(props: FlagProps): ReactNode {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <circle cx="16" cy="16" r="16" fill="#000" />
      <path fill="#D00" d="M0 10.7h32v10.6H0z" />
      <path fill="#FFCE00" d="M0 21.3h32V32H0z" />
    </svg>
  )
}

function FlagPL(props: FlagProps): ReactNode {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <circle cx="16" cy="16" r="16" fill="#fff" />
      <path fill="#DC143C" d="M0 16h32v16H0z" />
    </svg>
  )
}

function FlagJP(props: FlagProps): ReactNode {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <circle cx="16" cy="16" r="16" fill="#fff" />
      <circle cx="16" cy="16" r="6.2" fill="#BC002D" />
    </svg>
  )
}

function FlagCN(props: FlagProps): ReactNode {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <circle cx="16" cy="16" r="16" fill="#DE2910" />
      <g fill="#FFDE00">
        <path d="M9.2 8.2 10.4 11.8 6.8 9.6h4.4L7.6 11.8z" />
        <circle cx="14.8" cy="6.2" r="1" />
        <circle cx="17.2" cy="8.2" r="1" />
        <circle cx="17.2" cy="11.4" r="1" />
        <circle cx="14.8" cy="13.2" r="1" />
      </g>
    </svg>
  )
}
