import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { soaps, type Soap } from '../data/soaps'
import SoapBar from './SoapBar'
import AddButton from './AddButton'
import WobbleText from './WobbleText'
import { BubbleField } from '../lib/bubbles'
import { gsap, ScrollTrigger, reduceMotion, scrollToTarget, splitWords } from '../lib/motion'

interface Props {
  onAdd: (soap: Soap, from: HTMLElement) => void
}

const HOLD = 0.7 // timeline units each soap rests on stage
const MOVE = 1 // timeline units for a swap

export default function SoapShowcase({ onAdd }: Props) {
  const root = useRef<HTMLElement>(null)
  const backCanvas = useRef<HTMLCanvasElement>(null)
  const frontCanvas = useRef<HTMLCanvasElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const slots = useRef<(HTMLDivElement | null)[]>([])
  const stRef = useRef<ScrollTrigger | null>(null)
  const [active, setActive] = useState(-1)

  // ---------- scroll choreography (transform + opacity only) ----------
  useLayoutEffect(() => {
    const el = root.current!
    splitWords(el.querySelector('.col-intro h2')!)
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add({ mobile: '(max-width: 760px)', desktop: '(min-width: 761px)' }, (c) => {
        const mobile = !!c.conditions?.mobile
        const slotEls = gsap.utils.toArray<HTMLElement>('.soap-slot')
        const words = gsap.utils.toArray<HTMLElement>('.bg-word')
        const vh = window.innerHeight
        const vw = window.innerWidth
        const offX = mobile ? vw * 0.5 : vw * 0.3

        gsap.set([...slotEls, ...words], { autoAlpha: 0, x: 0, y: 0, xPercent: 0, rotation: 0, scale: 1 })

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: () => '+=' + soaps.length * (mobile ? 90 : 100) + '%',
            pin: true,
            scrub: 0.5,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            snap: reduceMotion
              ? undefined
              : { snapTo: 'labelsDirectional', duration: { min: 0.25, max: 0.7 }, delay: 0.12, ease: 'power2.inOut' },
            onUpdate: (self) => {
              const t = self.progress * tl.duration()
              const idx = t < MOVE * 0.55 ? -1 : Math.min(soaps.length - 1, Math.floor((t - MOVE * 0.55) / (MOVE + HOLD) + 0.0001))
              setActive((p) => (p === idx ? p : idx))
            },
          },
        })
        stRef.current = tl.scrollTrigger!
        tl.addLabel('intro', 0)

        // Every tween is a fromTo with explicit values so GSAP never has to read
        // computed styles (which would force a full style recalc mid-scroll).
        const IN = { x: 0, y: 0, rotation: 0, scale: 1, autoAlpha: 1 }
        soaps.forEach((s, i) => {
          const start = i * (MOVE + HOLD)
          const dir = i % 2 ? -1 : 1
          const prevTint = i === 0 ? '#eef0e2' : soaps[i - 1].tint

          if (i === 0) {
            tl.fromTo('.col-intro', { yPercent: 0, autoAlpha: 1 }, { yPercent: -60, autoAlpha: 0, duration: 0.6, ease: 'power2.in', immediateRender: false }, start)
          } else {
            const pdir = (i - 1) % 2 ? -1 : 1
            tl.fromTo(slotEls[i - 1], IN,
              { x: -pdir * offX * 0.8, y: -vh * 0.85, rotation: -32 * pdir, scale: 0.62, autoAlpha: 1, duration: MOVE, ease: 'power2.in', immediateRender: false }, start)
              .fromTo(slotEls[i - 1], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2, immediateRender: false }, start + MOVE - 0.2)
              .fromTo(words[i - 1], { xPercent: 0, autoAlpha: 1 }, { xPercent: -30 * pdir, autoAlpha: 0, duration: MOVE, ease: 'power1.in', immediateRender: false }, start)
          }

          tl.fromTo('.col-bg', { backgroundColor: prevTint }, { backgroundColor: s.tint, duration: MOVE, ease: 'power1.inOut', immediateRender: false }, start)
            .fromTo(slotEls[i], { x: dir * offX, y: vh * 0.95, rotation: 38 * dir, scale: 0.55, autoAlpha: 1 },
              { ...IN, duration: MOVE, ease: 'power3.out', immediateRender: false }, start + 0.2)
            .fromTo(words[i], { xPercent: 30 * dir, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: MOVE, ease: 'power2.out', immediateRender: false }, start + 0.1)
            .addLabel('s' + i, start + MOVE + 0.2)
            .to({}, { duration: HOLD }, start + MOVE)
        })
        tl.to({}, { duration: 0.3 })

        return () => {
          stRef.current = null
        }
      })

      gsap.from('.col-intro > *', {
        y: 40, opacity: 0, duration: 1, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 70%' },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  // ---------- bubbles that trail the moving soaps ----------
  useEffect(() => {
    const back = new BubbleField(backCanvas.current!, 1)
    const front = new BubbleField(frontCanvas.current!, 1)
    back.max = 160
    front.max = 60
    const prev = new Map<number, { x: number; y: number }>()
    const acc = new Map<number, number>()
    // stage centre relative to the canvas; the section is pinned so this only changes on resize
    let base = { x: 0, y: 0, w: 300, h: 200 }
    const measure = () => {
      back.resize()
      front.resize()
      const cr = backCanvas.current!.getBoundingClientRect()
      const sr = stage.current!.getBoundingClientRect()
      const svg = slots.current[0]?.querySelector('svg')
      base = {
        x: sr.left - cr.left + sr.width / 2,
        y: sr.top - cr.top + sr.height / 2,
        w: svg?.clientWidth ?? 300,
        h: svg?.clientHeight ?? 200,
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root.current!)

    let visible = false
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(root.current!)

    const onBurst = (e: Event) => {
      const { x, y } = (e as CustomEvent).detail
      const r = frontCanvas.current!.getBoundingClientRect()
      front.burst(x - r.left, y - r.top, 18, 240)
    }
    window.addEventListener('herbora:burst', onBurst)

    let last = performance.now()
    const tick = () => {
      const now = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!visible) return
      slots.current.forEach((slot, i) => {
        if (!slot) return
        // read GSAP's cached transform values — no style or layout reads
        if (slot.style.visibility === 'hidden') { prev.delete(i); return }
        const op = parseFloat(slot.style.opacity || '1')
        const cx = base.x + (gsap.getProperty(slot, 'x') as number)
        const cy = base.y + (gsap.getProperty(slot, 'y') as number)
        const p = prev.get(i)
        prev.set(i, { x: cx, y: cy })
        if (!p || op < 0.05 || reduceMotion) return
        const vx = (cx - p.x) / Math.max(dt, 0.001)
        const vy = (cy - p.y) / Math.max(dt, 0.001)
        const speed = Math.hypot(vx, vy)
        if (speed < 1 && Math.random() > 0.05) return
        const rate = Math.min(90, 2 + speed * 0.08)
        let a = (acc.get(i) ?? 0) + rate * dt
        const nx = speed > 1 ? vx / speed : 0
        const ny = speed > 1 ? vy / speed : -1
        while (a > 1) {
          a -= 1
          const ang = Math.random() * Math.PI * 2
          const rad = Math.sqrt(Math.random())
          const sx = cx - nx * base.w * 0.32 + Math.cos(ang) * base.w * 0.34 * rad
          const sy = cy - ny * base.h * 0.32 + Math.sin(ang) * base.h * 0.3 * rad
          const big = Math.random() < 0.08
          const size = big ? 22 + Math.random() * 22 : 3 + Math.random() ** 2 * 16
          const field = Math.random() < 0.22 ? front : back
          field.spawn(sx, sy, -vx * 0.18 + (Math.random() - 0.5) * 60, -vy * 0.18 - 20 - Math.random() * 30, size, 1.4 + Math.random() * 1.8)
        }
        acc.set(i, a)
      })
      back.step(dt)
      front.step(dt)
      back.draw()
      front.draw()
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      io.disconnect()
      ro.disconnect()
      window.removeEventListener('herbora:burst', onBurst)
    }
  }, [])

  const jump = (i: number) => {
    const st = stRef.current
    if (st) scrollToTarget(st.labelToScroll('s' + i), 1.4)
  }

  const current = soaps[Math.max(0, active)]

  return (
    <section
      className="collection"
      id="soaps"
      ref={root}
      style={{ ['--deep' as string]: active < 0 ? '#2f5418' : current.deep, ['--soap' as string]: active < 0 ? '#6a9440' : current.color }}
    >
      <div className="col-bg" aria-hidden="true" />
      <div className="col-glow" aria-hidden="true" />
      <div className="bg-words" aria-hidden="true">
        {soaps.map((s) => (
          <span key={s.id} className="bg-word" style={{ WebkitTextStrokeColor: s.deep + '2a' }}>{s.name.split(' ')[0]}</span>
        ))}
      </div>

      <div className="col-intro">
        <span className="pill">The collection</span>
        <h2 className="h2">Nine bars.<br />Nine <em>gardens.</em></h2>
        <p>Cold-processed in small batches and cured for six slow weeks. Scroll to meet them, one lather at a time.</p>
      </div>

      <canvas ref={backCanvas} className="col-bubbles" aria-hidden="true" />

      <div className="stage" ref={stage} aria-hidden="true">
        <div className="puddle">
          <i /><i /><i />
        </div>
        {soaps.map((s, i) => (
          <div key={s.id} className="soap-slot" ref={(d) => { slots.current[i] = d }}>
            <div className="soap-shadow" />
            <div className="soap-float" style={{ animationDelay: `${-i * 0.7}s` }}>
              <SoapBar soap={s} seed={i + 1} />
            </div>
          </div>
        ))}
      </div>

      <canvas ref={frontCanvas} className="col-bubbles front" aria-hidden="true" />

      <div className="infos">
        {soaps.map((s, i) => (
          <article key={s.id} className={'info' + (active === i ? ' on' : '')} aria-hidden={active !== i} style={{ ['--deep' as string]: s.deep, ['--soap' as string]: s.color }}>
            <div className="info-top r">
              <span className="info-idx">{String(i + 1).padStart(2, '0')}</span>
              <span className="pill">{s.latin}</span>
            </div>
            <h3 className="info-name r">
              <WobbleText text={s.name} />
            </h3>
            <p className="info-tag r">{s.tagline}</p>
            <p className="info-desc r">{s.description}</p>
            <ul className="info-benefits r">
              {s.benefits.map((b) => (
                <li key={b}>
                  <svg viewBox="0 0 32 32" width="14" height="14" aria-hidden="true"><path d="M5 27C5 13 14 5 28 4c0 14-8 23-23 23z" fill="currentColor" /></svg>
                  {b}
                </li>
              ))}
            </ul>
            <div className="info-buy r">
              <div className="price">
                <span className="rupee">&#8377;</span>{s.price}
                <small>/ {s.weight}</small>
              </div>
              <AddButton soap={s} onAdd={onAdd} />
            </div>
          </article>
        ))}
      </div>

      <div className="col-counter" aria-hidden="true">
        <span className="cc-now">{active < 0 ? '00' : String(active + 1).padStart(2, '0')}</span>
        <span className="cc-bar"><i style={{ transform: `scaleX(${(active + 1) / soaps.length})` }} /></span>
        <span>{String(soaps.length).padStart(2, '0')}</span>
      </div>

      <nav className="rail" aria-label="Choose a soap">
        {soaps.map((s, i) => (
          <button
            key={s.id}
            className={'rail-dot' + (i === active ? ' on' : '')}
            style={{ ['--c' as string]: s.color }}
            onClick={() => jump(i)}
            aria-label={`Show ${s.name}`}
          >
            <span className="rail-tip">{s.name}</span>
          </button>
        ))}
      </nav>
      <span className="sr-only" aria-live="polite">{active >= 0 ? `${current.name} soap` : ''}</span>
    </section>
  )
}
