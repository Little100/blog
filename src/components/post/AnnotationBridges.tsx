import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  annotationTone,
  pathCurveParams,
  sanitizeAnnoIdPrefix,
  type PathCurveParams,
} from '../../utils/annotationVariation'

export const TEXT_ID = (prefix: string, i: number) => `BLOG-anno-text-${prefix}-${i}`
export const NOTE_ID = (prefix: string, i: number) => `BLOG-anno-note-${prefix}-${i}`

const MQ_WIDE = '(min-width: 1101px)'

function getScopedElementById(scope: HTMLElement | null | undefined, id: string): HTMLElement | null {
  if (scope) {
    try {
      return scope.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null
    } catch {
      /* ignore */
    }
  }
  return document.getElementById(id)
}

type Props = {
  idPrefix: string
  count: number
  active: boolean
  segmentVisible?: boolean[]
  /** Prefer querying inside this subtree (avoids stale nodes during route transitions). */
  domScope?: HTMLElement | null
}

type Segment = {
  i: number
  tone: number
  d: string
  tipX: number
  tipY: number
  deg: number
}

function segmentsEqual(a: Segment[], b: Segment[]): boolean {
  if (a.length !== b.length) return false
  for (let k = 0; k < a.length; k++) {
    const x = a[k]
    const y = b[k]
    if (
      x.d !== y.d ||
      x.i !== y.i ||
      x.tone !== y.tone ||
      x.tipX !== y.tipX ||
      x.tipY !== y.tipY ||
      x.deg !== y.deg
    ) {
      return false
    }
  }
  return true
}

function pathCurved(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curve?: PathCurveParams,
): { d: string; tipX: number; tipY: number; deg: number } | null {
  const minGap = 8
  if (x2 <= x1 + minGap) return null
  const dx = x2 - x1
  const dy = y2 - y1
  const liftMul = curve?.liftMul ?? 1
  const skewY = curve?.skewY ?? 0
  const bendAsym = curve?.bendAsym ?? 0
  const lift = Math.min(46, Math.max(14, dx * 0.09 + Math.abs(dy) * 0.18)) * liftMul
  const c1x = x1 + dx * (0.5 + bendAsym * 0.08)
  const c1y = y1 - lift + skewY
  const c2x = x2 - dx * (0.46 - bendAsym * 0.06)
  const c2y = y2 + lift * 0.42 - dy * 0.12 - skewY * 0.35
  const d = `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`
  const tdx = 3 * (x2 - c2x)
  const tdy = 3 * (y2 - c2y)
  return {
    d,
    tipX: x2,
    tipY: y2,
    deg: (Math.atan2(tdy, tdx) * 180) / Math.PI,
  }
}

function collectSegments(prefix: string, count: number, scope: HTMLElement | null | undefined): Segment[] {
  const pid = sanitizeAnnoIdPrefix(prefix)
  const out: Segment[] = []
  for (let i = 0; i < count; i++) {
    const note = getScopedElementById(scope, NOTE_ID(prefix, i))
    const text = getScopedElementById(scope, TEXT_ID(prefix, i))
    if (!note || !text) continue
    // Ignore DOM from a previous route or duplicate ids outside the current article body.
    if (!text.closest('[data-annotation-root]')) continue
    const nr = note.getBoundingClientRect()
    const tr = text.getBoundingClientRect()
    if (nr.width < 4 || tr.width < 2) continue
    const x1 = nr.right
    const y1 = nr.top + nr.height / 2
    const x2 = tr.left
    const y2 = tr.top + tr.height / 2
    const curve = pathCurveParams(pid, i)
    const seg = pathCurved(x1, y1, x2, y2, curve)
    if (!seg) continue
    const tone = annotationTone(pid, i)
    out.push({ i, tone, ...seg })
  }
  return out
}

function ArrowHeadFilled({ tone }: { tone: number }) {
  const cls = `annotation-bridges__arrowhead annotation-bridges__arrowhead--${tone % 4}`
  return <path d="M 0 0 L -9 -3.6 L -9 3.6 Z" className={cls} />
}

export function AnnotationBridges({ idPrefix, count, active, segmentVisible, domScope }: Props) {
  const [segments, setSegments] = useState<Segment[]>([])
  const [viewport, setViewport] = useState(() =>
    typeof window !== 'undefined'
      ? { w: window.innerWidth, h: window.innerHeight }
      : { w: 0, h: 0 },
  )
  const [wide, setWide] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MQ_WIDE).matches : false,
  )
  const raf = useRef(0)
  const [lit, setLit] = useState<number | null>(null)

  const remeasure = useCallback(() => {
    if (!active || count <= 0 || !wide) {
      setSegments((prev) => (prev.length === 0 ? prev : []))
      return
    }
    raf.current = requestAnimationFrame(() => {
      const next = collectSegments(idPrefix, count, domScope)
      setSegments((prev) => (segmentsEqual(prev, next) ? prev : next))
    })
  }, [active, count, idPrefix, wide, domScope])

  const segShow = segmentVisible ?? null

  useLayoutEffect(() => {
    setSegments([])
  }, [idPrefix])

  useLayoutEffect(() => {
    remeasure()
    const id = requestAnimationFrame(() => remeasure())
    return () => cancelAnimationFrame(id)
  }, [remeasure, segShow, idPrefix])

  useEffect(() => {
    const delays = [50, 120, 280, 520, 900, 1300, 1800]
    const timers = delays.map((ms) => window.setTimeout(() => remeasure(), ms))
    return () => timers.forEach(clearTimeout)
  }, [idPrefix, remeasure])

  useEffect(() => {
    if (!active || count <= 0) return
    const p = document.fonts?.ready?.then(() => remeasure())
    return () => void p
  }, [active, count, idPrefix, remeasure])

  useEffect(() => {
    if (!active || count <= 0) return
    const root =
      (domScope?.querySelector('[data-annotation-root]') as HTMLElement | null) ??
      document.querySelector('[data-annotation-root]')
    if (!root) return
    const ro = new ResizeObserver(() => remeasure())
    ro.observe(root)
    return () => ro.disconnect()
  }, [active, count, idPrefix, remeasure, domScope])

  useEffect(() => {
    const mq = window.matchMedia(MQ_WIDE)
    const onMq = () => setWide(mq.matches)
    onMq()
    mq.addEventListener('change', onMq)
    return () => mq.removeEventListener('change', onMq)
  }, [])

  useEffect(() => {
    const syncVp = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    syncVp()
    window.addEventListener('resize', syncVp)
    return () => window.removeEventListener('resize', syncVp)
  }, [])

  useEffect(() => {
    if (!active || count <= 0 || !wide) return
    const onScroll = () => {
      cancelAnimationFrame(raf.current)
      raf.current = requestAnimationFrame(() => {
        const next = collectSegments(idPrefix, count, domScope)
        setSegments((prev) => (segmentsEqual(prev, next) ? prev : next))
      })
    }
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    const ro = new ResizeObserver(onScroll)
    ro.observe(document.documentElement)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      ro.disconnect()
      cancelAnimationFrame(raf.current)
    }
  }, [active, count, idPrefix, wide, segShow, domScope])

  useEffect(() => {
    if (!active || count <= 0) return
    const cleanups: (() => void)[] = []
    const bind = () => {
      for (let i = 0; i < count; i++) {
        if (segShow && segShow[i] === false) continue
        const note = getScopedElementById(domScope, NOTE_ID(idPrefix, i))
        const text = getScopedElementById(domScope, TEXT_ID(idPrefix, i))
        const enter = () => setLit(i)
        const leaveNote = (ev: MouseEvent) => {
          const r = ev.relatedTarget as Node | null
          if (text?.contains(r)) return
          setLit((h) => (h === i ? null : h))
        }
        const leaveText = (ev: MouseEvent) => {
          const r = ev.relatedTarget as Node | null
          if (note?.contains(r)) return
          setLit((h) => (h === i ? null : h))
        }
        if (note) {
          note.addEventListener('mouseenter', enter)
          note.addEventListener('mouseleave', leaveNote)
          cleanups.push(() => {
            note.removeEventListener('mouseenter', enter)
            note.removeEventListener('mouseleave', leaveNote)
          })
        }
        if (text) {
          text.addEventListener('mouseenter', enter)
          text.addEventListener('mouseleave', leaveText)
          cleanups.push(() => {
            text.removeEventListener('mouseenter', enter)
            text.removeEventListener('mouseleave', leaveText)
          })
        }
      }
    }
    const t = window.setTimeout(bind, 0)
    return () => {
      clearTimeout(t)
      cleanups.forEach((c) => c())
    }
  }, [active, count, idPrefix, segShow, domScope])

  useEffect(() => {
    for (let i = 0; i < count; i++) {
      if (segShow && segShow[i] === false) continue
      getScopedElementById(domScope, TEXT_ID(idPrefix, i))?.classList.toggle('md-anno--lit', lit === i)
      getScopedElementById(domScope, NOTE_ID(idPrefix, i))?.classList.toggle('anno-note--lit', lit === i)
    }
  }, [lit, idPrefix, count, segShow, domScope])

  const drawn = segShow ? segments.filter((s) => segShow[s.i] !== false) : segments

  if (!active || count <= 0 || !wide || drawn.length === 0) return null
  if (viewport.w < 2 || viewport.h < 2) return null

  const svg = (
    <svg
      className="annotation-bridges"
      width={viewport.w}
      height={viewport.h}
      viewBox={`0 0 ${viewport.w} ${viewport.h}`}
      preserveAspectRatio="xMinYMin meet"
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
      }}
    >
      {drawn.map((s) => (
        <g key={s.i}>
          <path
            d={s.d}
            className={`annotation-bridges__path annotation-bridges__path--${s.tone % 4}${
              lit === s.i ? ' annotation-bridges__path--lit' : ''
            }`}
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
          <g transform={`translate(${s.tipX} ${s.tipY}) rotate(${s.deg})`}>
            <ArrowHeadFilled tone={s.tone} />
          </g>
        </g>
      ))}
    </svg>
  )

  if (typeof document === 'undefined') return null
  const mount = document.getElementById('annotation-bridges-mount')
  return mount ? createPortal(svg, mount) : null
}
