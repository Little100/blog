import { useEffect, useRef } from 'react'
import { useTheme } from '../../theme/ThemeContext'

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type BLOGState = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  targetX: number
  targetY: number
  nextRetarget: number
  rgba: [number, number, number, number]
}

type DotState = {
  x: number
  y: number
  r: number
  phase: number
  vx: number
  vy: number
}

const BLOG_COUNT = 5
const DOT_COUNT = 34
const BG_LIGHT = '#dde1ea'
const BG_DARK = '#1a1f2e'

const PALETTE_LIGHT: [number, number, number, number][] = [
  [255, 125, 168, 0.58],
  [95, 168, 248, 0.52],
  [175, 145, 248, 0.48],
  [248, 198, 108, 0.46],
  [120, 210, 195, 0.44],
]

const PALETTE_DARK: [number, number, number, number][] = [
  [118, 122, 252, 0.5],
  [72, 198, 255, 0.44],
  [168, 118, 255, 0.42],
  [236, 200, 108, 0.38],
  [158, 210, 255, 0.4],
]

export function BLOGBackdrop() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDarkRef = useRef(isDark)

  useEffect(() => {
    isDarkRef.current = isDark
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const ctx2d = canvasEl.getContext('2d', { alpha: false })
    if (!ctx2d) return

    const surface: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } = {
      canvas: canvasEl,
      ctx: ctx2d,
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const seed = Math.floor(Math.random() * 2_147_483_647)
    const rnd = mulberry32(seed)

    let w = 0
    let h = 0
    let dpr = 1
    let raf = 0
    let lastT = performance.now()
    const BLOGs: BLOGState[] = []
    const dots: DotState[] = []
    const margin = 0.07

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      surface.canvas.width = Math.floor(w * dpr)
      surface.canvas.height = Math.floor(h * dpr)
      surface.canvas.style.width = `${w}px`
      surface.canvas.style.height = `${h}px`
      surface.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function placeInView() {
      return {
        x: (margin + rnd() * (1 - 2 * margin)) * w,
        y: (margin + rnd() * (1 - 2 * margin)) * h,
      }
    }

    function initBLOGs() {
      BLOGs.length = 0
      const pal = isDarkRef.current ? PALETTE_DARK : PALETTE_LIGHT
      const m = Math.min(w, h)
      for (let i = 0; i < BLOG_COUNT; i++) {
        const p = placeInView()
        BLOGs.push({
          x: p.x,
          y: p.y,
          vx: (rnd() - 0.5) * 0.55,
          vy: (rnd() - 0.5) * 0.55,
          r: (0.055 + rnd() * 0.08) * m,
          targetX: p.x,
          targetY: p.y,
          nextRetarget: performance.now() + rnd() * 4000,
          rgba: pal[i % pal.length]!,
        })
      }
    }

    function initDots() {
      dots.length = 0
      const pad = Math.max(16, Math.min(w, h) * 0.035)
      const rw = Math.max(16, w - 2 * pad)
      const rh = Math.max(16, h - 2 * pad)
      for (let i = 0; i < DOT_COUNT; i++) {
        dots.push({
          x: pad + rnd() * rw,
          y: pad + rnd() * rh,
          r: 1.6 + rnd() * 2.4,
          phase: rnd() * Math.PI * 2,
          vx: (rnd() - 0.5) * 0.6,
          vy: (rnd() - 0.5) * 0.6,
        })
      }
    }

    function softReflect(b: BLOGState) {
      const pad = b.r * 0.32
      if (b.x < pad) {
        b.x = pad
        b.vx += 0.045
      }
      if (b.x > w - pad) {
        b.x = w - pad
        b.vx -= 0.045
      }
      if (b.y < pad) {
        b.y = pad
        b.vy += 0.045
      }
      if (b.y > h - pad) {
        b.y = h - pad
        b.vy -= 0.045
      }
    }

    function stepBLOG(b: BLOGState, t: number, dt: number) {
      if (t > b.nextRetarget) {
        const next = placeInView()
        b.targetX = next.x
        b.targetY = next.y
        b.nextRetarget = t + 2600 + rnd() * 9000
      }
      const dx = b.targetX - b.x
      const dy = b.targetY - b.y
      const pull = 0.000058 * dt
      b.vx += dx * pull + (rnd() - 0.5) * 0.024 * dt
      b.vy += dy * pull + (rnd() - 0.5) * 0.024 * dt
      b.vx *= 0.9982
      b.vy *= 0.9982
      b.x += b.vx * dt * 0.055
      b.y += b.vy * dt * 0.055
      softReflect(b)
    }

    function stepDots(dt: number, t: number) {
      const pad = 12
      for (const d of dots) {
        const nx = Math.sin(t * 0.00033 + d.phase)
        const ny = Math.cos(t * 0.00029 + d.phase * 1.13)
        d.x += (d.vx * 0.02 + nx * 0.038) * dt
        d.y += (d.vy * 0.02 + ny * 0.034) * dt
        if (d.x < pad) d.vx += 0.014 * dt
        if (d.x > w - pad) d.vx -= 0.014 * dt
        if (d.y < pad) d.vy += 0.014 * dt
        if (d.y > h - pad) d.vy -= 0.014 * dt
        d.vx *= 0.999
        d.vy *= 0.999
      }
    }

    function drawFrame(t: number, advance: boolean) {
      const dt = Math.min(48, Math.max(0, t - lastT))
      lastT = t

      const dark = isDarkRef.current
      const { ctx } = surface
      ctx.fillStyle = dark ? BG_DARK : BG_LIGHT
      ctx.fillRect(0, 0, w, h)

      if (advance && !reducedMotion) {
        for (const b of BLOGs) stepBLOG(b, t, dt)
        stepDots(dt, t)
      }

      for (const b of BLOGs) {
        const [r, gc, bc, a] = b.rgba
        const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
        grd.addColorStop(0, `rgba(${r},${gc},${bc},${a})`)
        grd.addColorStop(0.18, `rgba(${r},${gc},${bc},${a * 0.78})`)
        grd.addColorStop(0.42, `rgba(${r},${gc},${bc},${a * 0.32})`)
        grd.addColorStop(0.72, `rgba(${r},${gc},${bc},${a * 0.1})`)
        grd.addColorStop(1, `rgba(${r},${gc},${bc},0)`)
        ctx.fillStyle = grd
        ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2)
      }

      ctx.fillStyle = dark ? 'rgba(14, 18, 28, 0.07)' : 'rgba(240, 242, 248, 0.14)'
      ctx.fillRect(0, 0, w, h)

      for (const d of dots) {
        const pul = 0.78 + 0.22 * Math.sin(t * 0.0009 + d.phase)
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r * pul, 0, Math.PI * 2)
        ctx.fillStyle = dark ? `rgba(255,255,255,${0.2 * pul})` : `rgba(32, 28, 40,${0.18 * pul})`
        ctx.fill()
      }
    }

    function loop(t: number) {
      drawFrame(t, true)
      raf = requestAnimationFrame(loop)
    }

    function onResize() {
      resize()
      initBLOGs()
      initDots()
      lastT = performance.now()
      drawFrame(lastT, false)
    }

    resize()
    initBLOGs()
    initDots()
    drawFrame(performance.now(), false)

    if (reducedMotion) {
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }

    raf = requestAnimationFrame(loop)
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [isDark])

  return <canvas ref={canvasRef} className="BLOG-backdrop" aria-hidden />
}
