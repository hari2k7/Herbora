import { memo } from 'react'
import SoapBar from './SoapBar'
import { soaps } from '../data/soaps'

/**
 * Hero water. Everything here moves with compositor-only CSS animations
 * (transform / opacity) — no per-frame JavaScript, no canvas, no filters.
 * Each wave is a periodic SVG strip twice the viewport wide that slides by -50%.
 */

const TILE = 1440

function wave(amp: number, periods: number, h = 40) {
  const mid = h / 2
  let d = `M0 ${h} L0 ${mid}`
  const total = TILE * 2
  for (let x = 0; x <= total; x += 24) {
    const y = mid + Math.sin((x / TILE) * Math.PI * 2 * periods) * amp
    d += ` L${x} ${y.toFixed(1)}`
  }
  return d + ` L${total} ${h} Z`
}

const BACK = [
  { cls: 'w-back', d: wave(7, 3), fill: '#cde8dc' },
  { cls: 'w-mid', d: wave(10, 2), fill: '#86c7b0' },
]
const FRONT = [
  { cls: 'w-over', d: wave(10, 2), fill: 'rgba(80,160,138,.55)' },
  { cls: 'w-front', d: wave(12, 2), fill: '#3d8a73' },
]

const FLOATERS = [
  { soap: soaps[6], seed: 3, cls: 'fl-l' },
  { soap: soaps[0], seed: 1, cls: 'fl-c' },
  { soap: soaps[3], seed: 7, cls: 'fl-r' },
]

const BUBBLES = Array.from({ length: 12 }, (_, i) => ({
  left: (i * 37 + 7) % 100,
  size: 6 + ((i * 13) % 18),
  dur: 5 + ((i * 7) % 5),
  delay: -((i * 1.7) % 8),
}))

function Layer({ cls, d, fill }: { cls: string; d: string; fill: string }) {
  return (
    <div className={'wave ' + cls}>
      <svg className="wave-strip" viewBox={`0 0 ${TILE * 2} 40`} preserveAspectRatio="none" aria-hidden="true">
        <path d={d} fill={fill} />
      </svg>
      <div className="wave-body" />
    </div>
  )
}

function Pad({ r, flower }: { r: number; flower?: boolean }) {
  return (
    <svg viewBox="-60 -50 120 70" aria-hidden="true">
      <g transform="scale(1 0.36)">
        <path d={`M0 0 L${r} ${-r * 0.16} A${r} ${r} 0 1 1 ${r} ${r * 0.16} Z`} fill="#67a842" stroke="#2f6420" strokeWidth="3" />
        <path d={`M0 0 L${-r * 0.8} 0 M0 0 L${-r * 0.4} ${r * 0.7} M0 0 L${-r * 0.4} ${-r * 0.7}`} stroke="#3d7a2a" strokeWidth="3" />
      </g>
      {flower && (
        <g transform="translate(0 -10)">
          {[-50, -25, 0, 25, 50].map((a) => (
            <ellipse key={a} cx="0" cy="-10" rx="6" ry="14" fill="#f6c6d6" stroke="#c9587a" strokeWidth="1.4" transform={`rotate(${a})`} />
          ))}
          <circle r="4" cy="-2" fill="#f2c94c" />
        </g>
      )}
    </svg>
  )
}

function Pond() {
  return (
    <div className="pond" aria-hidden="true">
      {BACK.map((l) => <Layer key={l.cls} {...l} />)}
      <div className="pond-bubbles">
        {BUBBLES.map((b, i) => (
          <span key={i} style={{ left: b.left + '%', width: b.size, height: b.size, animationDuration: b.dur + 's', animationDelay: b.delay + 's' }} />
        ))}
      </div>
      {FLOATERS.map((f) => (
        <div key={f.soap.id} className={'floater ' + f.cls}>
          <div className="floater-bob">
            <SoapBar soap={f.soap} seed={f.seed} compact />
          </div>
        </div>
      ))}
      {FRONT.map((l) => <Layer key={l.cls} {...l} />)}
      <div className="pad pad-1"><Pad r={46} /></div>
      <div className="pad pad-2"><Pad r={38} flower /></div>
      <div className="pad pad-3"><Pad r={42} /></div>
      <div className="pad pad-4"><Pad r={50} /></div>
    </div>
  )
}

export default memo(Pond)
