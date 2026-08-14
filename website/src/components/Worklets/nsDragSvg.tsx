import * as React from 'react'

const D = 'M11.25 10.75 8 14.25l-3.25-3.5m6.5-5.5L8 1.75l-3.25 3.5'

/** Up/down move glyph — WavePad's drag cursor without the horizontal arms. */
export const NsDragSvg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}>
    <path d={D} stroke="#111" strokeWidth={2.75} />
    <path d={D} stroke="#fff" strokeWidth={1.5} />
  </svg>
)
