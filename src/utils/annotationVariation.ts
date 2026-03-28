export function sanitizeAnnoIdPrefix(prefix: string): string {
  const p = prefix.replace(/[^a-zA-Z0-9_-]/g, '-')
  return p || 'p'
}

export function hashAnnoSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function annotationTone(idPrefix: string, index: number): number {
  const p = sanitizeAnnoIdPrefix(idPrefix)
  return hashAnnoSeed(`${p}\0tone\0${index}`) % 4
}

export type MarginCardJitter = {
  shiftPx: number
  rotateDeg: number
  radiusPx: number
}

export function marginCardJitter(idPrefix: string, index: number): MarginCardJitter {
  const p = sanitizeAnnoIdPrefix(idPrefix)
  const h = hashAnnoSeed(`${p}\0margin\0${index}`)
  const u = (mask: number) => (h >>> mask) & 0xff
  const shiftPx = (u(0) / 255) * 18 - 9
  const rotateDeg = (u(8) / 255) * 1.5 - 0.75
  const radiusPx = 10 + (u(16) / 255) * 5
  return { shiftPx, rotateDeg, radiusPx }
}

export function marginCardWidthPx(idPrefix: string, index: number): number {
  const p = sanitizeAnnoIdPrefix(idPrefix)
  const h = hashAnnoSeed(`${p}\0cardw\0${index}`)
  const u = (h & 0xffff) / 65535
  const min = 172
  const max = 232
  return Math.round(min + u * (max - min))
}

export type PathCurveParams = {
  liftMul: number
  skewY: number
  bendAsym: number
}

export function pathCurveParams(idPrefix: string, index: number): PathCurveParams {
  const p = sanitizeAnnoIdPrefix(idPrefix)
  const h = hashAnnoSeed(`${p}\0path\0${index}`)
  const u0 = (h & 0xff) / 255
  const u1 = ((h >>> 8) & 0xff) / 255
  const u2 = ((h >>> 16) & 0xff) / 255
  return {
    liftMul: 0.72 + u0 * 0.56,
    skewY: u1 * 24 - 12,
    bendAsym: u2 * 0.22 - 0.11,
  }
}

export function packAnnotationTops(
  rawTops: number[],
  heights: number[],
  minGapPx: number,
  fallbackHeightPx: number,
): number[] {
  const n = rawTops.length
  if (n === 0) return []
  const order = [...Array(n).keys()].sort((a, b) => rawTops[a] - rawTops[b])
  const packed = [...rawTops]
  let prevBottom = -Infinity
  for (const idx of order) {
    const h = heights[idx] > 8 ? heights[idx] : fallbackHeightPx
    const top = Math.max(rawTops[idx], prevBottom + minGapPx)
    packed[idx] = top
    prevBottom = top + h
  }
  return packed
}
