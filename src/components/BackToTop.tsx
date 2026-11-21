import { useEffect, useRef } from 'react'
import { getLenis, initLenis } from '../lib/motion'

const R = 22
const C = 2 * Math.PI * R

/**
 * Round "back to top" button. Its ring fills with scroll progress and a leaf
 * arrow floats up on hover. Updated straight from the scroll loop (no React re-renders).
 */
export default function BackToTop() {
  const btn = useRef<HTMLButtonElement>(null)
  const ring = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const lenis = getLenis() ?? initLenis()
    let shown = false
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const y = window.scrollY
      const p = max > 0 ? y / max : 0
      ring.current?.setAttribute('stroke-dashoffset', (C * (1 - p)).toFixed(1))
      const show = y > window.innerHeight * 0.8
      if (show !== shown) {
        shown = show
        btn.current?.classList.toggle('on', show)
      }
    }
    update()
    lenis.on('scroll', update)
    return () => lenis.off('scroll', update)
  }, [])

  const toTop = () => {
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(0, { duration: 2, easing: (t) => 1 - Math.pow(1 - t, 4) })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button ref={btn} className="to-top" onClick={toTop} aria-label="Back to top">
      <svg className="to-top-ring" viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r={R} fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2.5" />
        <circle ref={ring} cx="26" cy="26" r={R} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={C.toFixed(1)} strokeDashoffset={C.toFixed(1)} transform="rotate(-90 26 26)" />
      </svg>
      <svg className="to-top-arrow" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M12 19V6M6 11l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
