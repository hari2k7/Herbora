import { memo, useEffect, useId, useMemo, useRef } from 'react'
import type { Soap } from '../data/soaps'
import { darken, lighten, mix } from '../lib/color'
import { seeded } from '../lib/util'

/**
 * A soap bar drawn with layered gradients rather than outlines: a rounded
 * bevel built from stacked tinted slices, a domed top face with soft falloff,
 * a fine grain texture, a gentle sheen and a debossed stamp. No SVG filters,
 * so it rasterises once and then moves on the compositor.
 */

const SHAPES = {
  bar: 'M100 34 H320 C365 34 392 61 392 106 V154 C392 199 365 226 320 226 H100 C55 226 28 199 28 154 V106 C28 61 55 34 100 34 Z',
  oval: 'M210 28 C318 28 396 72 396 130 C396 188 318 232 210 232 C102 232 24 188 24 130 C24 72 102 28 210 28 Z',
  pebble:
    'M58 128 C52 64 140 30 226 34 C320 38 388 76 386 134 C384 194 306 230 206 228 C114 226 64 192 58 128 Z',
}

const INNER = {
  bar: 'M124 74 H296 C326 74 344 92 344 118 V142 C344 168 326 186 296 186 H124 C94 186 76 168 76 142 V118 C76 92 94 74 124 74 Z',
  oval: 'M210 76 C284 76 336 100 336 130 C336 160 284 184 210 184 C136 184 84 160 84 130 C84 100 136 76 210 76 Z',
  pebble:
    'M110 128 C108 92 158 74 218 76 C282 78 330 98 330 132 C330 166 282 184 212 184 C148 184 112 164 110 128 Z',
}

// One shared grain tile gives every bar a matte, pressed texture. It's generated once,
// when the browser is idle, and encoded with toBlob (asynchronous, off the main thread)
// so it never blocks scrolling or the first paint.
let grainPromise: Promise<string | null> | null = null
function grain(): Promise<string | null> {
  if (grainPromise) return grainPromise
  grainPromise = new Promise((resolve) => {
    const make = () => {
      const S = 64
      const c = document.createElement('canvas')
      c.width = c.height = S
      const g = c.getContext('2d')
      if (!g) return resolve(null)
      const img = g.createImageData(S, S)
      const r = seeded(42)
      for (let i = 0; i < img.data.length; i += 4) {
        const v = r()
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v > 0.5 ? 255 : 0
        img.data[i + 3] = Math.floor(Math.abs(v - 0.5) * 2 * 46)
      }
      g.putImageData(img, 0, 0)
      c.toBlob((b) => resolve(b ? URL.createObjectURL(b) : null), 'image/png')
    }
    if ('requestIdleCallback' in window) window.requestIdleCallback(make, { timeout: 2500 })
    else globalThis.setTimeout(make, 400)
  })
  return grainPromise
}

/**
 * Rendered once per page: the single grain pattern every soap bar points at.
 * When the texture is ready only this tiny component updates — no soap re-renders.
 */
export function GrainDefs() {
  const img = useRef<SVGImageElement>(null)
  useEffect(() => {
    let alive = true
    grain().then((u) => { if (alive && u && img.current) img.current.setAttribute('href', u) })
    return () => { alive = false }
  }, [])
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <pattern id="herbora-grain" width="64" height="64" patternUnits="userSpaceOnUse">
          <image ref={img} width="64" height="64" />
        </pattern>
      </defs>
    </svg>
  )
}

interface Props {
  soap: Soap
  seed?: number
  className?: string
  /** small soaps skip the name line */
  compact?: boolean
}

function SoapBar({ soap, seed = 1, className, compact }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const { color, deep, shape, texture, textureColor = deep } = soap
  const gel = texture === 'gel'

  // textures batched into a few paths, kept soft and low-contrast
  const marks = useMemo(() => {
    const r = seeded(seed * 9973 + soap.id.length * 131)
    const inside = () => {
      const a = r() * Math.PI * 2
      const d = Math.sqrt(r()) * 0.88
      return [210 + Math.cos(a) * 165 * d, 130 + Math.sin(a) * 86 * d]
    }
    const f = (n: number) => n.toFixed(1)
    const dot = (x: number, y: number, rad: number) =>
      `M${f(x - rad)} ${f(y)}a${f(rad)} ${f(rad)} 0 1 0 ${f(rad * 2)} 0a${f(rad)} ${f(rad)} 0 1 0 ${f(-rad * 2)} 0`
    const items: React.ReactNode[] = []
    if (texture === 'speckle') {
      const b = ['', '', '']
      for (let i = 0; i < 110; i++) {
        const [x, y] = inside()
        b[i % 3] += dot(x, y, 0.5 + r() * 1.4)
      }
      b.forEach((d, i) => items.push(<path key={i} d={d} fill={textureColor} opacity={0.14 + i * 0.1} />))
    } else if (texture === 'flecks') {
      const b = ['', '']
      for (let i = 0; i < 60; i++) {
        const [x, y] = inside()
        const len = 2 + r() * 5
        const ang = r() * Math.PI
        b[i % 2] += `M${f(x)} ${f(y)}l${f(Math.cos(ang) * len)} ${f(Math.sin(ang) * len)}`
      }
      b.forEach((d, i) => items.push(<path key={i} d={d} stroke={textureColor} strokeWidth={1.3} strokeLinecap="round" opacity={0.4 + i * 0.25} />))
    } else if (texture === 'strands') {
      let d = ''
      for (let i = 0; i < 18; i++) {
        const [x, y] = inside()
        const dx = 8 + r() * 12
        const bend = (r() - 0.5) * 12
        d += `M${f(x)} ${f(y)}q${f(dx / 2)} ${f(bend)} ${f(dx)} ${f(bend / 3)}`
      }
      items.push(<path key="s" d={d} stroke={textureColor} strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={0.6} />)
    } else if (gel) {
      let bubbles = ''
      for (let i = 0; i < 26; i++) {
        const [x, y] = inside()
        bubbles += dot(x, y, 0.8 + r() * 3.2)
      }
      let flakes = ''
      for (let i = 0; i < 9; i++) {
        const [x, y] = inside()
        const rx = 8 + r() * 18
        const ry = 3 + r() * 5
        flakes += `M${f(x - rx)} ${f(y)}a${f(rx)} ${f(ry)} 0 1 0 ${f(rx * 2)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-rx * 2)} 0`
      }
      items.push(<path key="f" d={flakes} fill={textureColor} opacity={0.22} />)
      items.push(<path key="b" d={bubbles} fill="none" stroke="#ffffff" strokeWidth={0.8} opacity={0.55} />)
    }
    return items
  }, [seed, soap.id, texture, textureColor, gel])

  const face = SHAPES[shape]
  const inner = INNER[shape]
  const label = soap.name.split(' ')[0].toUpperCase()

  // bevel: stacked slices from the dark underside up to the lit rim
  const sideTop = mix(color, deep, 0.28)
  const sideBottom = darken(mix(color, deep, 0.7), 0.12)
  const slices = [30, 24, 18, 13, 9, 5.5, 3]

  return (
    <svg className={className} viewBox="0 0 420 290" role="img" aria-label={`${soap.name} soap bar`}>
      <defs>
        <linearGradient id={`side${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sideTop} />
          <stop offset="1" stopColor={sideBottom} />
        </linearGradient>
        {/* cylindrical shading across the side: darker at the ends */}
        <linearGradient id={`cyl${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="0.3" stopColor="#000" stopOpacity="0.02" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000" stopOpacity="0.32" />
        </linearGradient>
        <radialGradient id={`top${id}`} cx="40%" cy="32%" r="78%">
          <stop offset="0" stopColor={lighten(color, gel ? 0.38 : 0.2)} />
          <stop offset="0.55" stopColor={color} />
          <stop offset="1" stopColor={mix(color, deep, 0.3)} />
        </radialGradient>
        {/* pillow dome: soft darkening toward the rim */}
        <radialGradient id={`dome${id}`} cx="50%" cy="46%" r="62%">
          <stop offset="0.62" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity={gel ? 0.12 : 0.2} />
        </radialGradient>
        <radialGradient id={`sheen${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff" stopOpacity={gel ? 0.6 : 0.34} />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`rim${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`clip${id}`}>
          <path d={face} />
        </clipPath>
      </defs>

      {/* body + rounded bevel */}
      <path d={face} transform="translate(0 34)" fill={`url(#side${id})`} opacity={gel ? 0.9 : 1} />
      <path d={face} transform="translate(0 34)" fill={`url(#cyl${id})`} />
      {slices.map((y, i) => (
        <path key={y} d={face} transform={`translate(0 ${y})`} fill={mix(sideTop, color, (i + 1) / (slices.length + 1))} opacity={gel ? 0.85 : 1} />
      ))}
      {/* lit edge where the bevel meets the top */}
      <path d={face} transform="translate(0 2)" fill={lighten(color, 0.16)} opacity={0.8} />

      {/* top face */}
      <path d={face} fill={`url(#top${id})`} opacity={gel ? 0.94 : 1} />
      <g clipPath={`url(#clip${id})`}>
        {/* shared grain pattern (see <GrainDefs/>); transparent until its image is ready */}
        <rect width="420" height="290" fill="url(#herbora-grain)" opacity={gel ? 0.35 : 0.8} />
        {marks}
        <path d={face} fill={`url(#dome${id})`} />
        <ellipse cx="150" cy="78" rx="150" ry="52" fill={`url(#sheen${id})`} transform="rotate(-8 150 78)" />
        <ellipse cx="300" cy="196" rx="70" ry="18" fill={`url(#sheen${id})`} opacity={0.35} />
      </g>
      <path d={face} fill="none" stroke={`url(#rim${id})`} strokeWidth={4} />

      {/* debossed stamp: shadow on the upper inner edge, light on the lower */}
      <path d={inner} transform="translate(0 -1.2)" fill="none" stroke="#000" strokeOpacity={0.16} strokeWidth={2.2} />
      <path d={inner} transform="translate(0 1.4)" fill="none" stroke="#fff" strokeOpacity={0.32} strokeWidth={2} />
      <path d={inner} fill="none" stroke={mix(color, deep, 0.35)} strokeOpacity={0.35} strokeWidth={1.4} />
      <g fontFamily="'Titan One', cursive" textAnchor="middle" fontSize={40} letterSpacing="1">
        <text x={210} y={(compact ? 145 : 134) - 1.2} fill="#000" fillOpacity={0.18}>HERBORA</text>
        <text x={210} y={(compact ? 145 : 134) + 1.5} fill="#fff" fillOpacity={0.34}>HERBORA</text>
        <text x={210} y={compact ? 145 : 134} fill={mix(color, deep, 0.32)} fillOpacity={0.9}>HERBORA</text>
      </g>
      {!compact && (
        <g fontFamily="'Lilita One', cursive" textAnchor="middle" letterSpacing="5" fontSize={14}>
          <text x={210} y={164.2} fill="#fff" fillOpacity={0.32}>{label}</text>
          <text x={210} y={163} fill={mix(color, deep, 0.45)} fillOpacity={0.75}>{label}</text>
        </g>
      )}
    </svg>
  )
}

export default memo(SoapBar)
