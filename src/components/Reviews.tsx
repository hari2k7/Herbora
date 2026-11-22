import { useEffect, useRef, useState } from 'react'
import { reviews } from '../data/reviews'
import { soaps } from '../data/soaps'
import { darken, lighten, mix } from '../lib/color'

/**
 * Reviews printed on kraft-paper soap sleeves, tied with twine, fanned out like a deck.
 * Drag (or swipe) the top wrapper sideways to send it to the back; arrows, dots and
 * the keyboard do the same. Motion is CSS transitions on transform only.
 */

const FLING = 110 // px of drag that sends the top card away

function Leaves({ rating }: { rating: number }) {
  return (
    <span className="rv-leaves" role="img" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 32 32" width="16" height="16" aria-hidden="true" className={n <= rating ? 'on' : ''}>
          <path d="M5 27C5 13 14 5 28 4c0 14-8 23-23 23z" />
        </svg>
      ))}
    </span>
  )
}

function Wrapper({ index }: { index: number }) {
  const r = reviews[index]
  const soap = soaps.find((s) => s.id === r.soapId) ?? soaps[0]
  return (
    <article className="rv-card" aria-roledescription="review" style={{
      ['--soap' as string]: soap.color,
      ['--soap-light' as string]: lighten(soap.color, 0.25),
      ['--soap-dark' as string]: darken(mix(soap.color, soap.deep, 0.5), 0.05),
    }}>
      {/* the bar itself peeks out above and below the sleeve */}
      <span className="rv-soap-end top" aria-hidden="true" />
      <span className="rv-soap-end bottom" aria-hidden="true" />

      <div className="rv-sleeve">
        <span className="rv-twine" aria-hidden="true" />
        <span className="rv-knot" aria-hidden="true">
          <svg viewBox="0 0 60 40" width="60" height="40">
            <path d="M30 20 C18 4 4 8 8 18 C12 28 24 24 30 20 Z" fill="none" stroke="#9b7b4f" strokeWidth="3.4" strokeLinecap="round" />
            <path d="M30 20 C42 4 56 8 52 18 C48 28 36 24 30 20 Z" fill="none" stroke="#9b7b4f" strokeWidth="3.4" strokeLinecap="round" />
            <path d="M30 20 L22 38 M30 20 L38 38" stroke="#9b7b4f" strokeWidth="3.4" strokeLinecap="round" />
            <circle cx="30" cy="20" r="4.5" fill="#8a6a40" />
          </svg>
        </span>

        <header className="rv-head">
          <span className="rv-brand">HERBORA</span>
          <span className="rv-label">A note from a customer</span>
        </header>

        <div className="rv-rate-row">
          <Leaves rating={r.rating} />
          {r.sample && <span className="rv-sample" aria-label="Sample review, not from a real customer">Sample</span>}
        </div>
        <blockquote className="rv-text">&ldquo;{r.text}&rdquo;</blockquote>

        <footer className="rv-foot">
          <span className="rv-who">
            <b>{r.name}</b>
            {r.city && <span>{r.city}</span>}
          </span>
          <span className="rv-used">
            <i style={{ background: soap.color }} aria-hidden="true" />
            {soap.name}
          </span>
        </footer>

      </div>
    </article>
  )
}

export default function Reviews() {
  const N = reviews.length
  const [top, setTop] = useState(0)
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [flying, setFlying] = useState<{ index: number; dir: number } | null>(null)
  const [shown, setShown] = useState(false)
  const start = useRef<{ x: number; id: number } | null>(null)
  const root = useRef<HTMLElement>(null)

  // fan the deck out once the section scrolls into view
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.3 })
    io.observe(root.current!)
    return () => io.disconnect()
  }, [])

  const go = (dir: number) => {
    if (flying) return
    if (dir > 0) {
      // the top card flies off, then tucks in at the back
      setFlying({ index: top, dir: dx < 0 ? -1 : 1 })
      setDx(0)
      window.setTimeout(() => {
        setTop((t) => (t + 1) % N)
        setFlying(null)
      }, 320)
    } else {
      setTop((t) => (t - 1 + N) % N)
    }
  }

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (flying) return
    start.current = { x: e.clientX, id: e.pointerId }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* ignore */ }
    setDragging(true)
  }
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!start.current || start.current.id !== e.pointerId) return
    setDx(e.clientX - start.current.x)
  }
  const onUp = () => {
    if (!start.current) return
    start.current = null
    setDragging(false)
    if (Math.abs(dx) > FLING) go(1)
    else setDx(0)
  }

  const transformFor = (i: number) => {
    const pos = (i - top + N) % N
    if (flying && flying.index === i) {
      return { transform: `translate3d(${flying.dir * 125}%, -4%, 0) rotate(${flying.dir * 18}deg)`, zIndex: 50, opacity: 0 }
    }
    if (!shown) return { transform: `translate3d(0, 40px, 0) rotate(0deg) scale(0.95)`, zIndex: N - pos, opacity: pos === 0 ? 1 : 0 }
    if (pos === 0) return { transform: `translate3d(${dx}px, ${Math.abs(dx) * -0.05}px, 0) rotate(${dx * 0.05}deg)`, zIndex: N + 1, opacity: 1 }
    const fan = [
      { x: 0, y: 0, r: 0, s: 1 },
      { x: 26, y: 12, r: 5, s: 0.96 },
      { x: -24, y: 22, r: -6, s: 0.92 },
      { x: 10, y: 32, r: 2.5, s: 0.88 },
    ]
    const f = fan[Math.min(pos, fan.length - 1)]
    return { transform: `translate3d(${f.x}px, ${f.y}px, 0) rotate(${f.r}deg) scale(${f.s})`, zIndex: N - pos, opacity: pos < fan.length ? 1 : 0 }
  }

  return (
    <section className="reviews" id="reviews" ref={root} aria-labelledby="rv-title">
      <div className="rv-intro">
        <span className="pill">Kind words</span>
        <h2 id="rv-title" className="h2">Wrapped in <em>kind words.</em></h2>
        <p>Every bar leaves our hands in a paper sleeve. Here&rsquo;s what came back.</p>
        <div className="rv-controls">
          <button type="button" className="rv-arrow" onClick={() => go(-1)} aria-label="Previous review">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span className="rv-count" aria-live="polite">{String(top + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}</span>
          <button type="button" className="rv-arrow" onClick={() => go(1)} aria-label="Next review">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>

      <div
        className={'rv-deck' + (dragging ? ' dragging' : '')}
        tabIndex={0}
        role="group"
        aria-label="Customer reviews. Drag or use the arrow keys to see the next one."
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
          if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
        }}
      >
        {reviews.map((r, i) => {
          const pos = (i - top + N) % N
          const st = transformFor(i)
          return (
            <div
              key={r.id}
              className={'rv-slot' + (pos === 0 && !flying ? ' is-top' : '')}
              style={{ transform: st.transform, zIndex: st.zIndex, opacity: st.opacity, transitionDelay: shown && !dragging ? `${pos * 60}ms` : '0ms' }}
              aria-hidden={pos !== 0}
              onPointerDown={pos === 0 ? onDown : undefined}
              onPointerMove={pos === 0 ? onMove : undefined}
              onPointerUp={pos === 0 ? onUp : undefined}
              onPointerCancel={pos === 0 ? onUp : undefined}
            >
              <Wrapper index={i} />
            </div>
          )
        })}
        <p className="rv-hint" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Drag the wrapper to read the next note
        </p>
      </div>
    </section>
  )
}
