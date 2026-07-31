import * as React from 'react'

export const DragSvg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={80}
    height={80}
    viewBox="-0.05 -0.1 2.4 2.4"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMinYMin"
    className="jam jam-move"
    {...props}
  >
    <path d="M1.88.996 1.768.884a.1.1 0 1 1 .141-.142l.283.283a.1.1 0 0 1 0 .141l-.283.283a.1.1 0 0 1-.141-.141l.112-.112h-.649v.649l.112-.112a.1.1 0 0 1 .141.141l-.283.283a.1.1 0 0 1-.141 0l-.283-.283a.1.1 0 0 1 .141-.141l.112.112v-.649H.383l.112.112a.1.1 0 0 1-.141.141l-.283-.283a.1.1 0 0 1 0-.141L.354.742a.1.1 0 0 1 .141.142L.383.996h.649V.347L.92.459A.1.1 0 0 1 .779.318l.282-.283a.1.1 0 0 1 .141 0l.283.283a.1.1 0 1 1-.141.141L1.232.347v.649z" />
  </svg>
)
