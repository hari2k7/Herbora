import { memo } from 'react'
import SoapBar from './SoapBar'
import WaterGL from './WaterGL'
import { soaps } from '../data/soaps'

/**
 * Hero water: WebGL caustics underneath, then soaps resting on the surface,
 * each with a soft shadow on the sand below, expanding ripple rings and a little
 * cluster of lather. Floating neem leaves drift across. Motion is CSS-only.
 */

const FLOATERS = [
  { soap: soaps[6], seed: 3, cls: 'fl-l' },
  { soap: soaps[0], seed: 1, cls: 'fl-c' },
  { soap: soaps[3], seed: 7, cls: 'fl-r' },
]

// foam bubbles around each bar: [x%, y%, size px]
const FOAM: [number, number, number][] = [
  [8, 78, 14], [14, 86, 9], [20, 80, 6], [88, 74, 12], [94, 82, 7], [82, 88, 9], [50, 94, 8], [60, 90, 5], [30, 92, 6],
]

function Leaf({ id }: { id: string }) {
  return (
    <svg viewBox="-10 -10 150 70" aria-hidden="true">
      <defs>
        <linearGradient id={`lf${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#86ad4c" />
          <stop offset="0.5" stopColor="#5d8a2e" />
          <stop offset="1" stopColor="#3f6a1f" />
        </linearGradient>
        <filter id={`ls${id}`} x="-20%" y="-40%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      {/* shadow cast on the sand */}
      <path d="M4 34 C30 8 92 6 128 30 C92 52 34 56 4 34 Z" transform="translate(10 14)" fill="#0d3b3b" opacity="0.28" filter={`url(#ls${id})`} />
      <path d="M4 24 C30 -2 92 -4 128 20 C92 42 34 46 4 24 Z" fill={`url(#lf${id})`} />
      <path d="M6 24 C50 20 90 19 126 20" stroke="#c9dc8c" strokeWidth="1.6" fill="none" opacity="0.8" />
      <path d="M30 23 l12 -12 M50 22 l14 -14 M70 21 l14 -13 M92 21 l12 -10 M38 24 l12 11 M60 23 l13 12 M82 22 l12 10"
        stroke="#a9c66a" strokeWidth="0.9" fill="none" opacity="0.55" />
      <path d="M14 18 C40 4 80 2 110 14" stroke="#fff" strokeWidth="2" fill="none" opacity="0.18" strokeLinecap="round" />
    </svg>
  )
}

function Pond() {
  return (
    <div className="pond" aria-hidden="true">
      <WaterGL />
      {FLOATERS.map((f) => (
        <div key={f.soap.id} className={'floater ' + f.cls}>
          <div className="fl-shadow" />
          <div className="fl-ripples"><i /><i /><i /></div>
          <div className="floater-bob">
            <SoapBar soap={f.soap} seed={f.seed} compact />
          </div>
          <div className="fl-foam">
            {FOAM.map(([x, y, s], i) => (
              <span key={i} style={{ left: x + '%', top: y + '%', width: s, height: s, animationDelay: -i * 0.6 + 's' }} />
            ))}
          </div>
        </div>
      ))}
      <div className="drift-leaf dl-1"><Leaf id="a" /></div>
      <div className="drift-leaf dl-2"><Leaf id="b" /></div>
      <div className="drift-leaf dl-3"><Leaf id="c" /></div>
    </div>
  )
}

export default memo(Pond)
