import { useEffect, useLayoutEffect, useRef } from 'react'
import { gsap, reduceMotion, splitWords } from '../lib/motion'

/**
 * A furry ribbon of grass arcing across a summer sky. Thousands of blades are
 * drawn on a canvas (batched by colour), each one sways in the wind and bends
 * away from the pointer with a little spring — so you can "comb" the grass.
 */

const COLORS = ['#1f4d16', '#2b6a1d', '#3a8526', '#4f9d2f', '#6cb83d', '#8fd157']
const BASE = '#25571a'

export default function GrassQuote() {
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useLayoutEffect(() => {
    const el = root.current!
    el.querySelectorAll<HTMLElement>('.split').forEach(splitWords)
    const ctx = gsap.context(() => {
      gsap.from('.quote-line .w', {
        opacity: 0, y: 40, duration: 1, stagger: 0.07, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 65%' },
      })
      gsap.from('.quote-note', { opacity: 0, y: 20, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 40%' } })
      gsap.fromTo('.grass-canvas', { yPercent: 18 }, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
    }, el)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const cv = canvas.current!
    const g = cv.getContext('2d')!
    let w = 0
    let h = 0
    let dpr = 1
    let T = 80 // band thickness

    // blade data (struct of arrays for speed)
    let n = 0
    let bx = new Float32Array(0), by = new Float32Array(0)
    let dxs = new Float32Array(0), dys = new Float32Array(0), len = new Float32Array(0)
    let ph = new Float32Array(0), ox = new Float32Array(0), oy = new Float32Array(0)
    let col = new Uint8Array(0)
    let order: Uint32Array = new Uint32Array(0)
    let flowers: { i: number }[] = []
    let bandPath: Path2D | null = null
    const shadow = document.createElement('canvas')

    const curve = (t: number) => {
      // cubic bezier "smile" across the viewport
      const portrait = w < h
      const p0 = portrait ? [-0.45 * w, 0.46 * h] : [-0.06 * w, 0.34 * h]
      const p1 = portrait ? [0.25 * w, 0.9 * h] : [0.32 * w, 0.96 * h]
      const p2 = portrait ? [0.75 * w, 0.88 * h] : [0.7 * w, 0.92 * h]
      const p3 = portrait ? [1.45 * w, 0.36 * h] : [1.08 * w, 0.06 * h]
      const u = 1 - t
      const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t
      const x = a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0]
      const y = a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]
      const tx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0])
      const ty = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1])
      const l = Math.hypot(tx, ty) || 1
      let nx = ty / l, ny = -tx / l
      if (ny > 0) { nx = -nx; ny = -ny } // normal points to the sky
      return { x, y, nx, ny }
    }

    const build = () => {
      const r = cv.getBoundingClientRect()
      w = r.width
      h = r.height
      dpr = Math.min(window.devicePixelRatio || 1, w < 700 ? 1 : 1.25)
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
      T = Math.max(w < 700 ? 66 : 46, Math.min(130, Math.min(w, h * 1.4) * 0.1))
      const mobile = w < 700
      // approximate curve length
      let L = 0
      let prev = curve(0)
      for (let i = 1; i <= 60; i++) {
        const c = curve(i / 60)
        L += Math.hypot(c.x - prev.x, c.y - prev.y)
        prev = c
      }
      n = Math.round((L * T) / (mobile ? 36 : 24))
      bx = new Float32Array(n); by = new Float32Array(n)
      dxs = new Float32Array(n); dys = new Float32Array(n); len = new Float32Array(n)
      ph = new Float32Array(n); ox = new Float32Array(n); oy = new Float32Array(n)
      col = new Uint8Array(n)
      const sc = mobile ? 0.8 : 1
      for (let i = 0; i < n; i++) {
        const t = Math.random()
        const c = curve(t)
        const off = Math.random() - 0.5 // -0.5 bottom .. 0.5 top
        bx[i] = c.x + c.nx * off * T
        by[i] = c.y + c.ny * off * T
        // fur on a tube: top points up, bottom hangs down, middle faces us (short)
        const side = off > -0.12 ? 1 : -1
        const jitter = (Math.random() - 0.5) * 1.1
        const ang = Math.atan2(c.ny * side, c.nx * side) + jitter
        const fore = 0.45 + Math.abs(off) * 1.4
        len[i] = (12 + Math.random() * 16) * fore * sc * (T / 100 + 0.4)
        dxs[i] = Math.cos(ang)
        dys[i] = Math.sin(ang)
        ph[i] = t * 14 + Math.random() * 0.8
        const lit = off * 0.9 + 0.5 + (Math.random() - 0.5) * 0.5
        col[i] = Math.max(0, Math.min(COLORS.length - 1, Math.floor(lit * COLORS.length)))
      }
      // draw dark blades first, bright ones last
      order = Uint32Array.from({ length: n }, (_, i) => i).sort((a, b) => col[a] - col[b])
      flowers = []
      const fCount = mobile ? 14 : 34
      for (let k = 0; k < fCount; k++) {
        let i = (Math.random() * n) | 0
        let tries = 0
        while ((col[i] < 4 || dys[i] > -0.4) && tries++ < 50) i = (Math.random() * n) | 0
        flowers.push({ i })
      }
      // solid band underneath so the fur never shows gaps
      const p = new Path2D()
      for (let i = 0; i <= 80; i++) {
        const c = curve(i / 80)
        const x = c.x + c.nx * T * 0.42, y = c.y + c.ny * T * 0.42
        i ? p.lineTo(x, y) : p.moveTo(x, y)
      }
      for (let i = 80; i >= 0; i--) {
        const c = curve(i / 80)
        p.lineTo(c.x - c.nx * T * 0.42, c.y - c.ny * T * 0.42)
      }
      p.closePath()
      bandPath = p
      // pre-render the soft drop shadow once
      shadow.width = cv.width
      shadow.height = cv.height
      const sg = shadow.getContext('2d')!
      sg.setTransform(dpr, 0, 0, dpr, 0, 0)
      sg.translate(0, T * 0.35)
      sg.filter = 'blur(18px)'
      sg.fillStyle = 'rgba(10,40,90,0.28)'
      sg.fill(p)
    }

    const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, on: false }
    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      mouse.x = e.clientX - r.left
      mouse.y = e.clientY - r.top
      if (!mouse.on) { mouse.sx = mouse.x; mouse.sy = mouse.y }
      mouse.on = true
    }
    const onLeave = () => { mouse.on = false; mouse.x = mouse.y = -9999 }
    const sec = root.current!
    sec.addEventListener('pointermove', onMove)
    sec.addEventListener('pointerdown', onMove)
    sec.addEventListener('pointerleave', onLeave)
    sec.addEventListener('pointercancel', onLeave)

    build()
    const ro = new ResizeObserver(build)
    ro.observe(cv)

    let visible = false
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(cv)

    const buckets = COLORS.map(() => new Path2D())
    let raf = 0
    let frame = 0
    let settled = true
    const t0 = performance.now()
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      if (!visible || !n) return
      // when nobody is touching the grass, a gentle 30fps sway is plenty
      frame++
      if (!mouse.on && settled && frame % 2) return
      const time = reduceMotion ? 0 : (now - t0) / 1000
      // smoothed pointer
      if (mouse.on) {
        mouse.sx += (mouse.x - mouse.sx) * 0.25
        mouse.sy += (mouse.y - mouse.sy) * 0.25
      } else { mouse.sx = mouse.sy = -9999 }
      const R = Math.max(90, T * 1.3)
      const R2 = R * R
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, w, h)

      // soft shadow under the ribbon
      g.drawImage(shadow, 0, 0, w, h)
      g.fillStyle = BASE
      if (bandPath) g.fill(bandPath)

      // dark crater where the pointer parts the fur
      if (mouse.on) {
        const grd = g.createRadialGradient(mouse.sx, mouse.sy, 0, mouse.sx, mouse.sy, R * 0.8)
        grd.addColorStop(0, 'rgba(6,26,6,0.85)')
        grd.addColorStop(0.55, 'rgba(8,30,8,0.45)')
        grd.addColorStop(1, 'rgba(8,30,8,0)')
        g.save()
        if (bandPath) g.clip(bandPath)
        g.fillStyle = grd
        g.fillRect(mouse.sx - R, mouse.sy - R, R * 2, R * 2)
        g.restore()
      }

      for (let k = 0; k < buckets.length; k++) buckets[k] = new Path2D()
      let moving = 0
      for (let j = 0; j < n; j++) {
        const i = order[j]
        const l = len[i]
        const sway = Math.sin(time * 1.6 + ph[i]) * 0.22 + Math.sin(time * 0.7 + ph[i] * 0.3) * 0.12
        let tx = bx[i] + (dxs[i] + sway * 0.6) * l
        let ty = by[i] + (dys[i] + sway * 0.15) * l
        // pointer push with spring easing
        let px = 0, py = 0
        const mx = bx[i] - mouse.sx, my = by[i] - mouse.sy
        const d2 = mx * mx + my * my
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 1
          const f = 1 - d / R
          const push = f * Math.sqrt(f) * (l * 2.2 + 14)
          px = (mx / d) * push
          py = (my / d) * push
        }
        ox[i] += (px - ox[i]) * 0.16
        oy[i] += (py - oy[i]) * 0.16
        if (ox[i] > 0.3 || ox[i] < -0.3 || oy[i] > 0.3 || oy[i] < -0.3) moving++
        else if (px === 0) { ox[i] = 0; oy[i] = 0 }
        tx += ox[i]
        ty += oy[i]
        const p = buckets[col[i]]
        p.moveTo(bx[i], by[i])
        p.quadraticCurveTo(bx[i] + dxs[i] * l * 0.5 + ox[i] * 0.3, by[i] + dys[i] * l * 0.5 + oy[i] * 0.3, tx, ty)
      }
      g.lineCap = 'round'
      const lw = w < 700 ? 1.6 : 1.9
      for (let k = 0; k < buckets.length; k++) {
        g.strokeStyle = COLORS[k]
        g.lineWidth = lw
        g.stroke(buckets[k])
      }
      settled = moving === 0

      // little daisies on the top fur — batched into three paths
      const stems = new Path2D()
      const petals = new Path2D()
      const hearts = new Path2D()
      const fs = w < 700 ? 2.2 : 2.8
      for (const f of flowers) {
        const i = f.i
        const l = len[i] * 1.5
        const sway = Math.sin(time * 1.6 + ph[i]) * 0.22
        const x = bx[i] + (dxs[i] + sway * 0.6) * l + ox[i] * 1.2
        const y = by[i] + dys[i] * l + oy[i] * 1.2
        stems.moveTo(bx[i], by[i])
        stems.quadraticCurveTo(bx[i] + dxs[i] * l * 0.5, by[i] + dys[i] * l * 0.5, x, y)
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2 + ph[i]
          const cx = x + Math.cos(a) * fs
          const cy = y + Math.sin(a) * fs
          petals.moveTo(cx + fs * 0.75, cy)
          petals.arc(cx, cy, fs * 0.75, 0, Math.PI * 2)
        }
        hearts.moveTo(x + fs * 0.6, y)
        hearts.arc(x, y, fs * 0.6, 0, Math.PI * 2)
      }
      g.strokeStyle = '#4f9d2f'
      g.lineWidth = 1.2
      g.stroke(stems)
      g.fillStyle = '#ffffff'
      g.fill(petals)
      g.fillStyle = '#f2c230'
      g.fill(hearts)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      sec.removeEventListener('pointermove', onMove)
      sec.removeEventListener('pointerdown', onMove)
      sec.removeEventListener('pointerleave', onLeave)
      sec.removeEventListener('pointercancel', onLeave)
    }
  }, [])

  return (
    <section className="quote" id="story" ref={root}>
      <div className="quote-sky" aria-hidden="true" />
      <blockquote className="quote-text">
        <p className="quote-line q1 split">Rooted in soil,</p>
        <p className="quote-line q2 split">rinsed in rain.</p>
      </blockquote>
      <canvas ref={canvas} className="grass-canvas" aria-label="A ribbon of grass that parts under your cursor" role="img" />
      <p className="quote-note">
        HERBORA presses every bar by hand in small batches — herbs from local farms, oils pressed cold, nothing your grandmother couldn&rsquo;t pronounce.
      </p>
    </section>
  )
}
