import { useEffect, useMemo, useRef, useState } from 'react'
import { reduceMotion } from '../../lib/util'

/**
 * Press & hold to seal. A ring fills while you hold (mouse, touch, Space or Enter);
 * let go early and it drains back. At 100% a green wax seal stamps down.
 */

const HOLD_MS = reduceMotion ? 500 : 1300
const R = 46
const C = 2 * Math.PI * R

function waxPath() {
  // a slightly irregular blob, like poured wax
  const pts: string[] = []
  const N = 64
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2
    const r = 50 + Math.sin(a * 5 + 0.6) * 2.4 + Math.sin(a * 9 + 1.7) * 1.6 + Math.sin(a * 3) * 1.4
    pts.push(`${(60 + Math.cos(a) * r).toFixed(2)} ${(60 + Math.sin(a) * r).toFixed(2)}`)
  }
  return 'M' + pts.join(' L') + ' Z'
}

export default function WaxSeal({ sealed, onSealed }: { sealed: boolean; onSealed: () => void }) {
  const [progress, setProgress] = useState(0)
  const holding = useRef(false)
  const raf = useRef(0)
  const last = useRef(0)
  const value = useRef(0)
  const wax = useMemo(waxPath, [])

  const loop = (now: number) => {
    const dt = now - last.current
    last.current = now
    const dir = holding.current ? 1 : -2.2 // drains faster than it fills
    value.current = Math.max(0, Math.min(1, value.current + (dir * dt) / HOLD_MS))
    setProgress(value.current)
    if (value.current >= 1) {
      holding.current = false
      onSealed()
      return
    }
    if (holding.current || value.current > 0) raf.current = requestAnimationFrame(loop)
  }

  const start = () => {
    if (sealed) return
    holding.current = true
    cancelAnimationFrame(raf.current)
    last.current = performance.now()
    raf.current = requestAnimationFrame(loop)
  }
  const stop = () => { holding.current = false }

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  if (sealed) {
    return (
      <div className="seal sealed" role="img" aria-label="Order sealed with a Herbora wax seal">
        <svg viewBox="0 0 120 120" className="seal-wax">
          <defs>
            <radialGradient id="waxG" cx="38%" cy="32%" r="75%">
              <stop offset="0" stopColor="#4f8a3a" />
              <stop offset="0.55" stopColor="#2f6127" />
              <stop offset="1" stopColor="#1b3d18" />
            </radialGradient>
          </defs>
          <path d={wax} fill="url(#waxG)" />
          <circle cx="60" cy="60" r="36" fill="none" stroke="#173414" strokeOpacity="0.55" strokeWidth="3" />
          <circle cx="60" cy="60" r="36" fill="none" stroke="#8fc06f" strokeOpacity="0.35" strokeWidth="1.2" transform="translate(0.8 1)" />
          <g fontFamily="'Titan One', cursive" textAnchor="middle" fontSize="40">
            <text x="61" y="75" fill="#8fc06f" fillOpacity="0.35">H</text>
            <text x="60" y="74" fill="#173414" fillOpacity="0.7">H</text>
          </g>
          <ellipse cx="44" cy="36" rx="16" ry="7" fill="#fff" opacity="0.16" transform="rotate(-30 44 36)" />
        </svg>
        <span className="seal-label">Sealed</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      className={'seal' + (progress > 0 ? ' pressing' : '')}
      onPointerDown={(e) => { e.preventDefault(); start() }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start() } }}
      onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') stop() }}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Press and hold to seal your order"
    >
      <svg viewBox="0 0 120 120" className="seal-ring" aria-hidden="true">
        <circle cx="60" cy="60" r={R} fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="5" strokeDasharray="3 6" />
        <circle cx="60" cy="60" r={R} fill="none" stroke="#2f6127" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={C.toFixed(1)} strokeDashoffset={(C * (1 - progress)).toFixed(1)} transform="rotate(-90 60 60)" />
        <circle cx="60" cy="60" r={34 * progress} fill="#2f6127" opacity={0.18 + progress * 0.5} />
      </svg>
      <span className="seal-text">
        Press &amp; hold
        <br />
        to seal
      </span>
    </button>
  )
}
