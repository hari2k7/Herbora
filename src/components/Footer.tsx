import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Aloe, Badge, Coconut, Kuppaimeni, Mortar, Neem, Sandal } from './Herbs'
import { gsap, reduceMotion } from '../lib/motion'
import { openContact, SOAP_BOX_MESSAGE } from '../data/contact'
import ContactSheet from './ContactSheet'

const HERBS = [
  { id: 'neem', C: Neem, left: 0, top: -52, w: 22, rot: -10, label: 'Neem sprig' },
  { id: 'mortar', C: Mortar, left: 6, top: 38, w: 17, rot: 6, label: 'Mortar and pestle' },
  { id: 'aloe', C: Aloe, left: 28, top: -70, w: 14, rot: 4, label: 'Aloe vera' },
  { id: 'coconut', C: Coconut, left: 29, top: 46, w: 17, rot: -6, label: 'Coconut' },
  { id: 'badge', C: Badge, left: 44.5, top: 4, w: 12, rot: -6, label: 'Pure herbs stamp' },
  { id: 'sandal', C: Sandal, left: 56, top: 50, w: 21, rot: -4, label: 'Sandalwood logs' },
  { id: 'kuppaimeni', C: Kuppaimeni, left: 79, top: -66, w: 17, rot: 8, label: 'Kuppaimeni sprig' },
]

/** A pill whose outline is a soft scalloped wave; it ripples on hover. */
function WavyButton({ children, href, onClick }: { children: React.ReactNode; href: string; onClick?: () => void }) {
  const W = 230
  const H = 52
  const path = (phase: number, amp: number) => {
    const r = H / 2
    const straight = W - H
    const P = straight * 2 + Math.PI * H
    const pts: string[] = []
    const N = 180
    for (let i = 0; i < N; i++) {
      let s = (i / N) * P
      let x: number, y: number, nx: number, ny: number
      if (s < straight) { x = r + s; y = 0; nx = 0; ny = -1 }
      else if ((s -= straight) < Math.PI * r) { const a = -Math.PI / 2 + s / r; x = W - r + Math.cos(a) * r; y = r + Math.sin(a) * r; nx = Math.cos(a); ny = Math.sin(a) }
      else if ((s -= Math.PI * r) < straight) { x = W - r - s; y = H; nx = 0; ny = 1 }
      else { s -= straight; const a = Math.PI / 2 + s / r; x = r + Math.cos(a) * r; y = r + Math.sin(a) * r; nx = Math.cos(a); ny = Math.sin(a) }
      const off = Math.sin((i / N) * Math.PI * 2 * 22 + phase) * amp
      pts.push(`${(x + nx * off + 6).toFixed(2)} ${(y + ny * off + 6).toFixed(2)}`)
    }
    return 'M' + pts.join(' L') + ' Z'
  }
  const a = useMemo(() => path(0, 3), [])
  const b = useMemo(() => path(Math.PI, 4.2), [])
  return (
    <a className="wavy-btn" href={href} onClick={onClick ? (e) => { e.preventDefault(); onClick() } : undefined} style={{ ['--d1' as string]: `path('${a}')`, ['--d2' as string]: `path('${b}')` }}>
      <svg viewBox={`0 0 ${W + 12} ${H + 12}`} aria-hidden="true">
        <path className="wavy-shape" d={a} />
      </svg>
      <span>{children}</span>
    </a>
  )
}

export default function Footer() {
  const root = useRef<HTMLElement>(null)
  const herbEls = useRef<(HTMLDivElement | null)[]>([])

  // pointer-reactive herbs: shy away from the cursor, spring back, hop when tapped
  useEffect(() => {
    const sec = root.current!
    const state = HERBS.map(() => ({ x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0 }))
    const mouse = { x: -9999, y: -9999 }
    const move = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY }
    const leave = () => { mouse.x = mouse.y = -9999 }
    sec.addEventListener('pointermove', move)
    sec.addEventListener('pointerleave', leave)

    let visible = false
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(sec)

    const hops = herbEls.current.map((el, i) => {
      const fn = () => {
        resting = false
        const s = state[i]
        s.vy -= 16
        s.vr += (Math.random() < 0.5 ? -1 : 1) * 9
      }
      el?.addEventListener('click', fn)
      return fn
    })

    // herb centres relative to the footer, measured once (and on resize) instead of every frame
    let centres: { x: number; y: number; w: number }[] = []
    const measure = () => {
      const fr = sec.getBoundingClientRect()
      centres = herbEls.current.map((el) => {
        const r = el!.getBoundingClientRect()
        return { x: r.left - fr.left + r.width / 2, y: r.top - fr.top + r.height / 2, w: r.width }
      })
    }
    const ro = new ResizeObserver(measure)
    ro.observe(sec)
    let resting = false

    const tick = () => {
      if (!visible || !centres.length) return
      const fr = sec.getBoundingClientRect()
      const mx = mouse.x - fr.left
      const my = mouse.y - fr.top
      let energy = 0
      herbEls.current.forEach((el, i) => {
        if (!el) return
        const s = state[i]
        const c = centres[i]
        const dx = c.x - mx
        const dy = c.y - my
        const d = Math.hypot(dx, dy) || 1
        const R = Math.max(140, c.w * 0.95)
        let tx = 0, ty = 0, tr = 0
        if (d < R && !reduceMotion) {
          const f = 1 - d / R
          tx = (dx / d) * f * 34
          ty = (dy / d) * f * 22
          tr = (dx > 0 ? 1 : -1) * f * 16
        }
        // springs
        s.vx += (tx - s.x) * 0.09; s.vx *= 0.8; s.x += s.vx
        s.vy += (ty - s.y) * 0.09; s.vy *= 0.8; s.y += s.vy
        s.vr += (tr - s.r) * 0.08; s.vr *= 0.8; s.r += s.vr
        energy += Math.abs(s.vx) + Math.abs(s.vy) + Math.abs(s.vr) + Math.abs(tx - s.x) + Math.abs(tr - s.r)
        const inner = el.firstElementChild as HTMLElement
        inner.style.transform = `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0) rotate(${s.r.toFixed(2)}deg)`
      })
      // stop writing styles once everything has come to rest
      if (energy < 0.05) {
        if (!resting) resting = true
        state.forEach((s) => { s.x = s.y = s.r = s.vx = s.vy = s.vr = 0 })
      } else resting = false
    }
    const kick = () => { resting = false }
    sec.addEventListener('pointermove', kick)
    const wrapped = () => { if (!resting || mouse.x > -9999) tick() }
    gsap.ticker.add(wrapped)
    return () => {
      gsap.ticker.remove(wrapped)
      ro.disconnect()
      sec.removeEventListener('pointermove', kick)
      io.disconnect()
      sec.removeEventListener('pointermove', move)
      sec.removeEventListener('pointerleave', leave)
      herbEls.current.forEach((el, i) => el?.removeEventListener('click', hops[i]))
    }
  }, [])

  useLayoutEffect(() => {
    if (reduceMotion) return
    const ctx = gsap.context(() => {
      gsap.from('.f-word', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.f-mark', start: 'top 90%' } })
      gsap.from('.herb', {
        opacity: 0, scale: 0.5, y: 40, duration: 1, stagger: { each: 0.08, from: 'random' }, ease: 'back.out(2)',
        scrollTrigger: { trigger: '.f-mark', start: 'top 80%' },
      })
      gsap.from('.f-contact, .f-wa', { opacity: 0, y: 24, duration: 0.9, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: root.current, start: 'top 85%' } })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <footer className="footer" id="visit" ref={root}>
      <div className="f-top">
        <div className="f-contact">
          <h4>Contact us</h4>
          <p>Orders, gift boxes or a question about your skin &mdash; message us on WhatsApp and we&rsquo;ll reply personally.</p>
        </div>
        <div className="f-wa">
          <button type="button" className="wa-btn" onClick={() => openContact()} aria-haspopup="dialog">
            <span className="wa-icon" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="22" height="22">
                <path d="M16 3.5C9.1 3.5 3.5 9 3.5 15.8c0 2.4.7 4.6 1.9 6.5L3.6 28.5l6.4-1.7c1.8 1 3.8 1.5 6 1.5 6.9 0 12.5-5.5 12.5-12.3S22.9 3.5 16 3.5z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                <path d="M11.6 9.8c.4-.1.8 0 1 .4l1.2 2.7c.1.3.1.7-.2 1l-.9 1c.9 1.8 2.3 3.2 4.1 4.1l1-1c.3-.3.7-.3 1-.2l2.7 1.2c.4.2.5.6.4 1-.4 1.6-1.9 2.6-3.5 2.4-4.6-.6-8.2-4.2-8.8-8.8-.2-1.6.8-3.2 2.4-3.6z" fill="currentColor" />
              </svg>
            </span>
            <span className="wa-text">
              <span className="wa-label">Chat on WhatsApp</span>
              <span className="wa-num">We usually reply within a day</span>
            </span>
            <span className="wa-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </button>
        </div>
      </div>

      <div className="f-mark">
        <svg className="f-word" viewBox="0 0 1000 230" role="img" aria-label="Herbora">
          <defs>
            <linearGradient id="fwG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#efe9dc" />
              <stop offset="0.6" stopColor="#d9d2c3" />
              <stop offset="1" stopColor="#aaa293" />
            </linearGradient>
          </defs>
          <text x="500" y="208" textAnchor="middle" textLength="992" lengthAdjust="spacingAndGlyphs" fontSize="258" fontFamily="'Titan One', cursive" fill="url(#fwG)">
            HERBORA
          </text>
        </svg>
        {HERBS.map((h, i) => (
          <div
            key={h.id}
            className={'herb herb-' + h.id}
            ref={(d) => { herbEls.current[i] = d }}
            style={{ left: h.left + '%', top: h.top + '%', width: h.w + '%', ['--rot' as string]: h.rot + 'deg' }}
            role="img"
            aria-label={h.label}
          >
            <div className="herb-in">
              <h.C />
            </div>
          </div>
        ))}
      </div>

      <div className="f-bottom">
        <span>&copy; 2026 Herbora Naturals</span>
        <WavyButton href="#visit" onClick={() => openContact(SOAP_BOX_MESSAGE)}>Build your soap box</WavyButton>
        <span className="f-legal"><a href="#visit">Privacy</a> &middot; <a href="#visit">Terms</a></span>
      </div>
      <ContactSheet />
    </footer>
  )
}
