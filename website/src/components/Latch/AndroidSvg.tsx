import type {SVGProps} from 'react'

/** Simple Android mark — currentColor fill. */
export function AndroidSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}>
      <path
        fill="currentColor"
        d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24a11.43 11.43 0 0 0-8.94 0L5.65 5.67c-.19-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85l1.84 3.18C4.16 11.25 2.9 13.9 2.9 16.9h18.2c0-3-1.26-5.65-3.5-7.42M7.9 14.5a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2m8.2 0a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2"
      />
    </svg>
  )
}
