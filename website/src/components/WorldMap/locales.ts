import raw from '../../../locales.json'

import {countries} from './countries'

/** BCP-47 tag → ISO 3166-1 alpha-2, or null if it is not a country. */
export function regionOf(locale: string): string | null {
  const parts = locale.replace(/_/g, '-').split('-')
  const region = parts[1]
  if (region == null || !/^[A-Za-z]{2}$/.test(region)) return null
  return region.toUpperCase()
}

function uniqueLocales(tags: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const tag of tags) {
    const locale = tag.replace(/_/g, '-')
    if (seen.has(locale)) continue
    seen.add(locale)
    out.push(locale)
  }
  return out
}

const ON_MAP = new Set(countries.map((c) => c.id))

/** Country ISO2 → locales that resolve to it and exist on the 110m map. */
export const LOCALES_BY_COUNTRY: Record<string, string[]> = (() => {
  const byCountry: Record<string, string[]> = {}
  for (const locale of uniqueLocales(raw)) {
    const id = regionOf(locale)
    if (id == null || !ON_MAP.has(id)) continue
    const list = byCountry[id] ?? (byCountry[id] = [])
    if (!list.includes(locale)) list.push(locale)
  }
  return byCountry
})()

export const LIVE = new Set(Object.keys(LOCALES_BY_COUNTRY))

export function countryIdForLocale(locale: string): string | null {
  const normalized = locale.replace(/_/g, '-')
  for (const [id, locales] of Object.entries(LOCALES_BY_COUNTRY)) {
    if (locales.includes(normalized)) return id
  }
  const id = regionOf(normalized)
  return id != null && LIVE.has(id) ? id : null
}

/** Flagcdn — ISO 3166-1 alpha-2 PNGs (slice cleanly into country bounds). */
export function flagUrl(iso2: string): string {
  return `https://flagcdn.com/w640/${iso2.toLowerCase()}.png`
}

/** Axis-aligned bounds of an M/L path in viewBox units. */
export function pathBBox(d: string): {
  x: number
  y: number
  width: number
  height: number
} {
  const nums = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) ?? []
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i]!
    const y = nums[i + 1]!
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return {
    x: minX,
    y: minY,
    width: Math.max(0.5, maxX - minX),
    height: Math.max(0.5, maxY - minY),
  }
}

type Pt = {x: number; y: number}

type Box = {x: number; y: number; width: number; height: number}

export type FlagPiece = Box & {d: string}

const FLAG_ASPECT = 3 / 2
const LARGE_FRAC = 0.2
/** Merge nearby islands (Honshu+Hokkaido, Indonesia). Alaska stays separate. */
const MERGE_GAP = 12
const CENTER_PRECISION = 0.45

function ringsOf(d: string): Pt[][] {
  const rings: Pt[][] = []
  let ring: Pt[] = []
  const re = /([MLZmlz])([^MLZmlz]*)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(d)) != null) {
    const type = m[1]!.toUpperCase()
    if (type === 'Z') {
      if (ring.length >= 3) rings.push(ring)
      ring = []
      continue
    }
    const nums = (m[2] ?? '')
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number)
    if (type === 'M' && ring.length >= 3) {
      rings.push(ring)
      ring = []
    }
    for (let i = 0; i + 1 < nums.length; i += 2) {
      ring.push({x: nums[i]!, y: nums[i + 1]!})
    }
  }
  if (ring.length >= 3) rings.push(ring)
  return rings
}

function ringArea(ring: Pt[]): number {
  let sum = 0
  const n = ring.length
  for (let i = 0; i < n; i++) {
    const a = ring[i]!
    const b = ring[(i + 1) % n]!
    sum += a.x * b.y - b.x * a.y
  }
  return Math.abs(sum) / 2
}

function ringPath(ring: Pt[]): string {
  let d = `M${ring[0]!.x} ${ring[0]!.y}`
  for (let i = 1; i < ring.length; i++) {
    d += `L${ring[i]!.x} ${ring[i]!.y}`
  }
  return `${d}Z`
}

function ringBBox(ring: Pt[]): Box {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of ring) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return {
    x: minX,
    y: minY,
    width: Math.max(0.5, maxX - minX),
    height: Math.max(0.5, maxY - minY),
  }
}

function intersectBox(a: Box, b: Box): Box | null {
  const x0 = Math.max(a.x, b.x)
  const y0 = Math.max(a.y, b.y)
  const x1 = Math.min(a.x + a.width, b.x + b.width)
  const y1 = Math.min(a.y + a.height, b.y + b.height)
  if (x1 <= x0 || y1 <= y0) return null
  return {x: x0, y: y0, width: x1 - x0, height: y1 - y0}
}

function boxGap(a: Box, b: Box): number {
  const dx = Math.max(0, a.x - (b.x + b.width), b.x - (a.x + a.width))
  const dy = Math.max(0, a.y - (b.y + b.height), b.y - (a.y + a.height))
  return Math.hypot(dx, dy)
}

function pointInRing(p: Pt, ring: Pt[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]!
    const b = ring[j]!
    if (a.y > p.y !== b.y > p.y) {
      const x = ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
      if (p.x < x) inside = !inside
    }
  }
  return inside
}

function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = dx * dx + dy * dy
  if (len === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

function signedDist(p: Pt, ring: Pt[]): number {
  let min = Infinity
  for (let i = 0; i < ring.length; i++) {
    const d = distToSegment(p, ring[i]!, ring[(i + 1) % ring.length]!)
    if (d < min) min = d
  }
  return pointInRing(p, ring) ? min : -min
}

function ringCentroid(ring: Pt[]): Pt {
  let area = 0
  let cx = 0
  let cy = 0
  const n = ring.length
  for (let i = 0; i < n; i++) {
    const p = ring[i]!
    const q = ring[(i + 1) % n]!
    const cross = p.x * q.y - q.x * p.y
    area += cross
    cx += (p.x + q.x) * cross
    cy += (p.y + q.y) * cross
  }
  area *= 0.5
  if (Math.abs(area) < 1e-9) {
    return {
      x: ring.reduce((s, p) => s + p.x, 0) / n,
      y: ring.reduce((s, p) => s + p.y, 0) / n,
    }
  }
  return {x: cx / (6 * area), y: cy / (6 * area)}
}

/**
 * Pole of inaccessibility of `ring`, searched inside `search`.
 * Guaranteed on land (unlike a bbox / polygon centroid).
 */
function visualCenter(ring: Pt[], search: Box): Pt {
  type Cell = {x: number; y: number; h: number; d: number}
  const cell = (x: number, y: number, h: number): Cell => ({
    x,
    y,
    h,
    d: signedDist({x, y}, ring),
  })
  const cellMax = (c: Cell) => c.d + c.h * Math.SQRT2

  const seed = ringCentroid(ring)
  const inSearch =
    seed.x >= search.x &&
    seed.x <= search.x + search.width &&
    seed.y >= search.y &&
    seed.y <= search.y + search.height
  const mid = cell(
    search.x + search.width / 2,
    search.y + search.height / 2,
    0,
  )
  let best = cell(
    inSearch ? seed.x : mid.x,
    inSearch ? seed.y : mid.y,
    0,
  )
  if (mid.d > best.d) best = mid

  const size = Math.min(search.width, search.height)
  if (size < CENTER_PRECISION) return {x: best.x, y: best.y}

  const queue: Cell[] = []
  for (let y = search.y; y < search.y + search.height; y += size) {
    for (let x = search.x; x < search.x + search.width; x += size) {
      queue.push(cell(x + size / 2, y + size / 2, size / 2))
    }
  }

  while (queue.length > 0) {
    let top = 0
    for (let i = 1; i < queue.length; i++) {
      if (cellMax(queue[i]!) > cellMax(queue[top]!)) top = i
    }
    const cur = queue.splice(top, 1)[0]!
    if (cur.d > best.d) best = cur
    if (cellMax(cur) - best.d <= CENTER_PRECISION) continue
    const h = cur.h / 2
    queue.push(
      cell(cur.x - h, cur.y - h, h),
      cell(cur.x + h, cur.y - h, h),
      cell(cur.x - h, cur.y + h, h),
      cell(cur.x + h, cur.y + h, h),
    )
  }
  return {x: best.x, y: best.y}
}

function unionBox(boxes: Box[]): Box | null {
  if (boxes.length === 0) return null
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const b of boxes) {
    x0 = Math.min(x0, b.x)
    y0 = Math.min(y0, b.y)
    x1 = Math.max(x1, b.x + b.width)
    y1 = Math.max(y1, b.y + b.height)
  }
  return {x: x0, y: y0, width: x1 - x0, height: y1 - y0}
}

/**
 * 3:2 cover of `land` (CSS `background-size: cover`), then slide toward
 * `origin` without uncovering the land. Does not zoom to pin the origin
 * — that swallows emblems on thin countries.
 */
function coverSlide(land: Box, origin: Pt): Box {
  const width =
    land.width / land.height >= FLAG_ASPECT
      ? land.width
      : land.height * FLAG_ASPECT
  const height = width / FLAG_ASPECT
  const cx = Math.min(
    land.x + width / 2,
    Math.max(land.x + land.width - width / 2, origin.x),
  )
  const cy = Math.min(
    land.y + height / 2,
    Math.max(land.y + land.height - height / 2, origin.y),
  )
  return {x: cx - width / 2, y: cy - height / 2, width, height}
}

/**
 * One flag per distant land mass. Clip to the land, size with cover,
 * slide the flag so its center sits as close as possible to the pole
 * of inaccessibility (on land).
 */
export function flagPieces(d: string, view: Box): FlagPiece[] {
  const visible = ringsOf(d)
    .map((ring) => ({ring, area: ringArea(ring), box: ringBBox(ring)}))
    .filter((item) => intersectBox(item.box, view) != null)
  if (visible.length === 0) return []
  visible.sort((a, b) => b.area - a.area)
  const maxArea = visible[0]!.area

  const taken = new Set<(typeof visible)[number]>()
  const groups: (typeof visible)[] = []
  for (const item of visible) {
    if (taken.has(item)) continue
    if (item.area < maxArea * LARGE_FRAC) continue
    const group = [item]
    taken.add(item)
    let grew = true
    while (grew) {
      grew = false
      for (const other of visible) {
        if (taken.has(other)) continue
        if (group.some((member) => boxGap(member.box, other.box) <= MERGE_GAP)) {
          group.push(other)
          taken.add(other)
          grew = true
        }
      }
    }
    groups.push(group)
  }

  const out: FlagPiece[] = []
  for (const group of groups) {
    group.sort((a, b) => b.area - a.area)
    const main = group[0]!
    const search = intersectBox(main.box, view)
    if (search == null) continue
    const land = unionBox(
      group
        .map((item) => intersectBox(item.box, view))
        .filter((box): box is Box => box != null),
    )
    if (land == null) continue
    const origin = visualCenter(main.ring, search)
    out.push({
      d: group.map((item) => ringPath(item.ring)).join(''),
      ...coverSlide(land, origin),
    })
  }
  return out
}
