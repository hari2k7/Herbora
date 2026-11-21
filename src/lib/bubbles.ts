/**
 * A tiny canvas particle system for iridescent soap bubbles.
 * One pre-rendered sprite is scaled per bubble, so hundreds stay cheap.
 */
interface Bubble {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  life: number
  max: number
  wob: number
  phase: number
  popping: number
}

let sprite: HTMLCanvasElement | null = null

function getSprite() {
  if (sprite) return sprite
  const S = 128
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')!
  const r = S / 2 - 2
  const cx = S / 2
  // body: clear centre, faint film towards the rim
  const body = g.createRadialGradient(cx, cx, r * 0.2, cx, cx, r)
  body.addColorStop(0, 'rgba(255,255,255,0.02)')
  body.addColorStop(0.75, 'rgba(255,255,255,0.08)')
  body.addColorStop(0.93, 'rgba(255,255,255,0.32)')
  body.addColorStop(1, 'rgba(255,255,255,0.55)')
  g.fillStyle = body
  g.beginPath()
  g.arc(cx, cx, r, 0, Math.PI * 2)
  g.fill()
  // iridescent film arcs
  const hues = [
    ['rgba(255,120,200,0.45)', 0.2, 1.4],
    ['rgba(120,220,255,0.45)', 2.1, 3.3],
    ['rgba(255,230,120,0.35)', 3.6, 4.6],
    ['rgba(140,255,180,0.35)', 4.8, 5.9],
  ] as const
  g.lineWidth = 3
  hues.forEach(([col, a0, a1]) => {
    g.strokeStyle = col
    g.beginPath()
    g.arc(cx, cx, r - 3, a0, a1)
    g.stroke()
  })
  // rim
  g.strokeStyle = 'rgba(255,255,255,0.75)'
  g.lineWidth = 1.5
  g.beginPath()
  g.arc(cx, cx, r - 0.5, 0, Math.PI * 2)
  g.stroke()
  // highlights
  g.fillStyle = 'rgba(255,255,255,0.9)'
  g.beginPath()
  g.ellipse(cx - r * 0.42, cx - r * 0.45, r * 0.2, r * 0.1, -0.7, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = 'rgba(255,255,255,0.5)'
  g.beginPath()
  g.arc(cx + r * 0.45, cx + r * 0.5, r * 0.06, 0, Math.PI * 2)
  g.fill()
  sprite = c
  return c
}

export class BubbleField {
  private ctx: CanvasRenderingContext2D
  private bubbles: Bubble[] = []
  private w = 0
  private h = 0
  private dpr = 1
  max = 320

  private dirty = true

  constructor(private canvas: HTMLCanvasElement, private maxDpr = 2) {
    this.ctx = canvas.getContext('2d')!
    this.resize()
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect()
    this.dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr)
    this.w = rect.width
    this.h = rect.height
    this.canvas.width = Math.max(1, Math.round(rect.width * this.dpr))
    this.canvas.height = Math.max(1, Math.round(rect.height * this.dpr))
  }

  get size() {
    return { w: this.w, h: this.h }
  }

  spawn(x: number, y: number, vx = 0, vy = -30, r = 10, life = 3) {
    if (this.bubbles.length >= this.max) this.bubbles.shift()
    this.bubbles.push({ x, y, vx, vy, r, life, max: life, wob: 6 + Math.random() * 18, phase: Math.random() * 6.28, popping: 0 })
  }

  burst(x: number, y: number, n = 18, spread = 220) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const s = spread * (0.3 + Math.random() * 0.7)
      this.spawn(x, y, Math.cos(a) * s, Math.sin(a) * s - 60, 4 + Math.random() * 16, 1.2 + Math.random() * 1.6)
    }
  }

  step(dt: number) {
    const list = this.bubbles
    for (let i = list.length - 1; i >= 0; i--) {
      const b = list[i]
      if (b.popping > 0) {
        b.popping += dt
        if (b.popping > 0.22) list.splice(i, 1)
        continue
      }
      b.life -= dt
      b.phase += dt * 2.4
      // drag + buoyancy
      b.vx *= 1 - 1.6 * dt
      b.vy = b.vy * (1 - 1.6 * dt) - 26 * dt
      b.x += (b.vx + Math.sin(b.phase) * b.wob) * dt
      b.y += b.vy * dt
      if (b.life <= 0 || b.y < -80) b.popping = 0.0001
    }
  }

  draw() {
    const { ctx, dpr } = this
    // nothing on screen and nothing left over from last frame: skip the clear entirely
    if (!this.bubbles.length && !this.dirty) return
    this.dirty = this.bubbles.length > 0
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, this.w, this.h)
    const img = getSprite()
    for (const b of this.bubbles) {
      if (b.popping > 0) {
        const p = b.popping / 0.22
        ctx.globalAlpha = 1 - p
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r * (1 + p * 0.8), 0, Math.PI * 2)
        ctx.stroke()
        continue
      }
      const fadeIn = Math.min(1, (b.max - b.life) * 4)
      ctx.globalAlpha = fadeIn
      const s = 1 + Math.sin(b.phase * 1.3) * 0.04
      const rx = b.r * s
      const ry = b.r / s
      ctx.drawImage(img, b.x - rx, b.y - ry, rx * 2, ry * 2)
    }
    ctx.globalAlpha = 1
  }

  clear() {
    this.bubbles.length = 0
  }
}
