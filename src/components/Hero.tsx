import { useRef } from 'react'
import Pond from './Pond'
import WobbleText from './WobbleText'

/** Soap-foam cloud: a cluster of soft lobes speckled with tiny bubbles. */
export function FoamCloud({ flip = false }: { flip?: boolean }) {
  const lobes = [
    [70, 120, 62], [140, 92, 78], [230, 84, 88], [320, 104, 70], [390, 128, 52], [450, 140, 34], [500, 146, 22], [36, 146, 38],
  ]
  return (
    <svg viewBox="0 0 540 210" style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden="true">
      <defs>
        <radialGradient id="foamG" cx="45%" cy="30%" r="70%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#f5f7f0" />
          <stop offset="1" stopColor="#dfe6d8" />
        </radialGradient>
      </defs>
      <g fill="url(#foamG)">
        {lobes.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
        <rect x="36" y="130" width="470" height="56" rx="28" />
      </g>
      <g fill="none" stroke="#c9d6c4" strokeWidth="1.6">
        {[[120, 70, 9], [200, 50, 6], [262, 120, 11], [340, 88, 7], [170, 140, 5], [410, 120, 6], [90, 108, 5]].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>
      <g fill="#ffffff">
        {[[117, 67, 2.4], [197, 48, 1.8], [258, 116, 3], [337, 85, 2]].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>
    </svg>
  )
}

const LEAVES = Array.from({ length: 10 }, (_, i) => ({
  left: (i * 41 + 5) % 100,
  dur: 11 + ((i * 7) % 9),
  delay: -((i * 2.3) % 16),
  scale: 0.6 + ((i * 17) % 8) / 10,
}))

export default function Hero() {
  const root = useRef<HTMLElement>(null)

  return (
    <section className="hero" id="hero" ref={root}>
      <div className="hero-sun" aria-hidden="true" />
      <div className="cloud cloud-l"><div className="drift-a"><FoamCloud /></div></div>
      <div className="cloud cloud-r"><div className="drift-b"><FoamCloud flip /></div></div>

      <div className="hero-copy">
        <h1 className="hero-title">
          <WobbleText text="HERBORA" />
        </h1>
        <p className="hero-tag">
          Herbal soaps, hand-pressed from <em>Indian gardens.</em>
        </p>
        <div className="hero-cta">
          <a href="#soaps" className="btn-leaf" onClick={(e) => { e.preventDefault(); import('../lib/motion').then((m) => m.scrollToTarget('#soaps')) }}>
            <span className="btn-leaf-bg" aria-hidden="true" />
            <span className="btn-leaf-label">Meet the nine bars</span>
            <span className="btn-leaf-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </a>
        </div>
      </div>

      <div className="hero-media">
        <Pond />
      </div>
      <div className="leaves" aria-hidden="true">
        {LEAVES.map((l, i) => (
          <span key={i} className={'leaf-fall fall-' + (i % 3)} style={{ left: l.left + '%', scale: String(l.scale), animationDuration: l.dur + 's', animationDelay: l.delay + 's' }}>
            <svg viewBox="0 0 30 14" width="26" height="12"><path d="M1 7C8 0 22 0 29 7 22 14 8 14 1 7z" fill={i % 3 ? '#6a9440' : '#8fb357'} /><path d="M3 7h24" stroke="#3d6324" strokeWidth="1" /></svg>
          </span>
        ))}
      </div>
      <div className="scroll-cue" aria-hidden="true">
        <span className="cue-bubble" />
        <span>Scroll to lather</span>
      </div>
    </section>
  )
}
