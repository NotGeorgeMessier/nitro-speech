/** Phone geometry shared by SVG chrome + HTML overlays. */

export const PHONE_ASPECT = 0.48
export const PHONE_ISLAND_HY = 0.095
export const PHONE_HOME_HY = 0.055
export const PHONE_ISLAND_GAP = 2.4
export const PHONE_HOME_GAP = 2.6

export type CssRect = {
  left: number
  top: number
  width: number
  height: number
}

export type PhoneLayout = {
  cssW: number
  cssH: number
  phoneC: {x: number; y: number}
  phoneHalf: {x: number; y: number}
  stroke: number
  /** GL-style y-up bounds of the clear display */
  displayTop: number
  displayMid: number
  displayBot: number
  /** Full phone frame in CSS (y-down) */
  frame: CssRect
  /** Full inner glass (under island + home) in CSS */
  inner: CssRect
  /** Clear display (between island & home) in CSS */
  screen: CssRect
  /** Bottom half of clear display — phrase feed sizing */
  bottomHalf: CssRect
}

function phoneStroke(halfX: number) {
  return Math.max(1.6, halfX * 0.085)
}

function phoneChromeY(halfX: number) {
  const stroke = phoneStroke(halfX)
  const iy = halfX * PHONE_ISLAND_HY
  const hy = halfX * PHONE_HOME_HY
  return (
    2 * stroke +
    (PHONE_ISLAND_GAP + 1) * iy +
    (PHONE_HOME_GAP + 1) * hy
  )
}

export function computePhoneLayout(cssW: number, cssH: number): PhoneLayout {
  const pillarH = cssH * 0.34 * 2
  let phoneH = pillarH * 1.2
  let phoneW = phoneH * PHONE_ASPECT
  let halfX = phoneW * 0.5
  phoneH = pillarH + phoneChromeY(halfX)
  phoneW = phoneH * PHONE_ASPECT
  halfX = phoneW * 0.5
  phoneH = pillarH + phoneChromeY(halfX)
  phoneW = phoneH * PHONE_ASPECT
  const phoneHalf = {x: phoneW * 0.5, y: phoneH * 0.5}
  const phoneC = {x: cssW * 0.5, y: cssH * 0.5}

  const stroke = phoneStroke(phoneHalf.x)
  const iy = phoneHalf.x * PHONE_ISLAND_HY
  const hy = phoneHalf.x * PHONE_HOME_HY
  const displayTop =
    phoneC.y + phoneHalf.y - stroke - iy * (PHONE_ISLAND_GAP + 1)
  const displayBot =
    phoneC.y - phoneHalf.y + stroke + hy * (PHONE_HOME_GAP + 1)
  const displayMid = 0.5 * (displayTop + displayBot)

  const frame: CssRect = {
    left: phoneC.x - phoneHalf.x,
    top: cssH - (phoneC.y + phoneHalf.y),
    width: phoneW,
    height: phoneH,
  }

  const innerTopGl = phoneC.y + phoneHalf.y - stroke
  const innerBotGl = phoneC.y - phoneHalf.y + stroke
  const inner: CssRect = {
    left: phoneC.x - phoneHalf.x + stroke,
    top: cssH - innerTopGl,
    width: phoneW - 2 * stroke,
    height: innerTopGl - innerBotGl,
  }

  const screen: CssRect = {
    left: phoneC.x - phoneHalf.x + stroke,
    top: cssH - displayTop,
    width: phoneW - 2 * stroke,
    height: displayTop - displayBot,
  }

  const padX = phoneHalf.x * 0.12
  const bottomHalf: CssRect = {
    left: phoneC.x - phoneHalf.x + stroke + padX,
    top: cssH - displayMid,
    width: Math.max(0, phoneW - 2 * stroke - 2 * padX),
    height: Math.max(0, displayMid - displayBot),
  }

  return {
    cssW,
    cssH,
    phoneC,
    phoneHalf,
    stroke,
    displayTop,
    displayMid,
    displayBot,
    frame,
    inner,
    screen,
    bottomHalf,
  }
}
