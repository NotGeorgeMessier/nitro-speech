/** Shared peak field — keep in sync with waveShader GLSL. */

export const BAR_STEP = 0.26
export const SCROLL_SPEED = 1.35
export const PEAK_WIDTH = 2.35
export const FALLOFF_POW = 3.6

function fract(n: number) {
  return n - Math.floor(n)
}

function hash11(n: number) {
  return fract(Math.sin(n * 127.1) * 43758.5453123)
}

function sampleNormal(u1: number, u2: number, mu: number, sigma: number) {
  const r = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-4)))
  const theta = 6.2831853 * u2
  return mu + sigma * r * Math.cos(theta)
}

function peakAmp(cell: number) {
  const pick = hash11(cell + 17)
  const prev = hash11(cell - 1 + 17)
  const silentThresh = prev < 0.16 ? 0.06 : 0.16
  const u1 = hash11(cell * 1.913 + 91)
  const u2 = hash11(cell * 2.417 + 53)

  let mu: number
  let sigma: number
  if (pick < silentThresh) {
    mu = 0.15
    sigma = 0.05
  } else if (pick < 0.42) {
    mu = 0.66
    sigma = 0.07
  } else {
    mu = 0.84
    sigma = 0.07
  }
  return Math.min(1, Math.max(0, sampleNormal(u1, u2, mu, sigma)))
}

function peakFalloff(dist: number) {
  const t = Math.min(1, Math.max(0, dist))
  return (1 - t) ** FALLOFF_POW
}

export function mountainField(x: number) {
  const p = x / PEAK_WIDTH
  const c = Math.floor(p)
  const f = p - c
  const h0 = peakAmp(c) * peakFalloff(f)
  const h1 = peakAmp(c + 1) * peakFalloff(1 - f)
  return Math.max(h0, h1)
}

/** Level of the newest (leading) pillar at time t. */
export function leadingWaveLevel(t: number, cssW: number) {
  const pitch = Math.max(9, cssW / 28)
  const barIndex = Math.floor((cssW - pitch * 0.5) / pitch)
  const x = barIndex * BAR_STEP + t * SCROLL_SPEED
  return Math.min(1, Math.max(0, mountainField(x)))
}
