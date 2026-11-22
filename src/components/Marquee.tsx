import { useEffect, useRef } from 'react'
import { getLenis, reduceMotion } from '../lib/motion'

const WORDS = ['Cold-processed', 'Small batch', 'Homemade', 'Cruelty-free', 'Hand-cut']

const Leaf = () => (
  <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
    <path d="M5 27C5 13 14 5 28 4c0 14-8 23-23 23z" fill="currentColor" />
    <path d="M7 25C12 18 17 13 23 9" stroke="#1f3d2a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
  </svg>
)

/** Tilted ribbon that drifts on its own and speeds up / reverses with scroll velocity. */
export default function Marquee() {
  const wrap = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (reduceMotion) return
    let x = 0
    let raf = 0
    let dir = 1
    let half = 0
    const measure = () => (half = (track.current?.scrollWidth ?? 0) / 2)
    measure()
    window.addEventListener('resize', measure)
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const el = track.current
      if (!el || !half) return
      const v = getLenis()?.velocity ?? 0
      if (Math.abs(v) > 0.5) dir = v > 0 ? 1 : -1
      x -= (0.6 + Math.min(Math.abs(v) * 0.4, 14)) * dir
      if (x <= -half) x += half
      if (x > 0) x -= half
      el.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`
    }
    // only run while the ribbon is on screen
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf)
      if (e.isIntersecting) raf = requestAnimationFrame(loop)
    })
    io.observe(wrap.current!)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])
  const row = [...WORDS, ...WORDS]
  return (
    <div className="marquee-wrap">
    <div className="marquee" ref={wrap}>
      <p className="sr-only">{WORDS.join(', ')}</p>
      <div className="marquee-track" ref={track} aria-hidden="true">
        {[...row, ...row].map((w, i) => (
          <span key={i} className="mq-item">
            {w}
            <Leaf />
          </span>
        ))}
      </div>
    </div>
    </div>
  )
}
