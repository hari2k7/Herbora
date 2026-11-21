import { useId, useMemo } from 'react'
import type { Soap } from '../data/soaps'
import { darken, lighten, mix } from '../lib/color'
import { seeded } from '../lib/util'

const SHAPES = {
  bar: 'M100 34 H320 C365 34 392 61 392 106 V154 C392 199 365 226 320 226 H100 C55 226 28 199 28 154 V106 C28 61 55 34 100 34 Z',
  oval: 'M210 28 C318 28 396 72 396 130 C396 188 318 232 210 232 C102 232 24 188 24 130 C24 72 102 28 210 28 Z',
  pebble:
    'M58 128 C52 64 140 30 226 34 C320 38 388 76 386 134 C384 194 306 230 206 228 C114 226 64 192 58 128 Z',
}

const INNER = {
  bar: 'M120 70 H300 C330 70 350 90 350 118 V142 C350 170 330 190 300 190 H120 C90 190 70 170 70 142 V118 C70 90 90 70 120 70 Z',
  oval: 'M210 72 C286 72 342 98 342 130 C342 162 286 188 210 188 C134 188 78 162 78 130 C78 98 134 72 210 72 Z',
  pebble:
    'M106 128 C104 90 156 70 218 72 C284 74 336 96 336 132 C336 168 284 188 212 188 C146 188 108 166 106 128 Z',
}

interface Props {
  soap: Soap
  seed?: number
  className?: string
  /** small soaps skip the label to stay legible */
  compact?: boolean
}

export default function SoapBar({ soap, seed = 1, className, compact }: Props) {
  const raw = useId()
  const id = raw.replace(/[^a-zA-Z0-9]/g, '')
  const { color, deep, shape, texture, textureColor = deep } = soap
  const gel = texture === 'gel'

  // Textures are batched into a handful of <path> elements (3 opacity buckets)
  // instead of ~100 separate nodes per bar — far cheaper to style, lay out and paint.
  const marks = useMemo(() => {
    const r = seeded(seed * 9973 + soap.id.length * 131)
    const inside = () => {
      const a = r() * Math.PI * 2
      const d = Math.sqrt(r()) * 0.9
      return [210 + Math.cos(a) * 165 * d, 130 + Math.sin(a) * 88 * d]
    }
    const f = (n: number) => n.toFixed(1)
    const buckets = ['', '', '']
    const dot = (x: number, y: number, rad: number) =>
      `M${f(x - rad)} ${f(y)}a${f(rad)} ${f(rad)} 0 1 0 ${f(rad * 2)} 0a${f(rad)} ${f(rad)} 0 1 0 ${f(-rad * 2)} 0`
    const items: React.ReactNode[] = []
    if (texture === 'speckle') {
      for (let i = 0; i < 90; i++) {
        const [x, y] = inside()
        buckets[i % 3] += dot(x, y, 0.7 + r() * 1.9)
      }
      buckets.forEach((d, i) => items.push(<path key={i} d={d} fill={textureColor} opacity={0.25 + i * 0.18} />))
    } else if (texture === 'flecks') {
      for (let i = 0; i < 46; i++) {
        const [x, y] = inside()
        const len = 3 + r() * 6
        const ang = r() * Math.PI
        buckets[i % 3] += `M${f(x)} ${f(y)}l${f(Math.cos(ang) * len)} ${f(Math.sin(ang) * len)}`
      }
      buckets.forEach((d, i) => items.push(<path key={i} d={d} stroke={textureColor} strokeWidth={1.6} strokeLinecap="round" opacity={0.5 + i * 0.2} />))
    } else if (texture === 'strands') {
      let d = ''
      for (let i = 0; i < 16; i++) {
        const [x, y] = inside()
        const dx = 10 + r() * 14
        const bend = (r() - 0.5) * 14
        d += `M${f(x)} ${f(y)}q${f(dx / 2)} ${f(bend)} ${f(dx)} ${f(bend / 3)}`
      }
      items.push(<path key="s" d={d} stroke={textureColor} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.7} />)
    } else if (texture === 'gel') {
      let rings = ''
      for (let i = 0; i < 20; i++) {
        const [x, y] = inside()
        rings += dot(x, y, 1.5 + r() * 5)
      }
      let blobs = ''
      for (let i = 0; i < 7; i++) {
        const [x, y] = inside()
        const rx = 10 + r() * 16
        const ry = 4 + r() * 6
        blobs += `M${f(x - rx)} ${f(y)}a${f(rx)} ${f(ry)} 0 1 0 ${f(rx * 2)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-rx * 2)} 0`
      }
      items.push(<path key="b" d={blobs} fill={textureColor} opacity={0.35} />)
      items.push(<path key="r" d={rings} fill="none" stroke="#ffffff" strokeWidth={1} opacity={0.5} />)
    }
    return items
  }, [seed, soap.id, texture, textureColor])

  const face = SHAPES[shape]
  const inner = INNER[shape]
  const light = lighten(color, 0.42)
  const label = soap.name.split(' ')[0].toUpperCase()

  return (
    <svg className={className} viewBox="0 0 420 290" role="img" aria-label={`${soap.name} soap bar`}>
      <defs>
        <radialGradient id={`top${id}`} cx="32%" cy="26%" r="85%">
          <stop offset="0" stopColor={light} />
          <stop offset="0.5" stopColor={color} />
          <stop offset="1" stopColor={darken(color, 0.16)} />
        </radialGradient>
        <linearGradient id={`side${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(color, deep, 0.45)} />
          <stop offset="1" stopColor={darken(deep, 0.15)} />
        </linearGradient>
        <radialGradient id={`gloss${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff" stopOpacity={gel ? 0.75 : 0.55} />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`clip${id}`}>
          <path d={face} />
        </clipPath>
      </defs>

      {/* thickness */}
      <path d={face} transform="translate(0 34)" fill={`url(#side${id})`} opacity={gel ? 0.85 : 1} />
      <path d={face} transform="translate(0 17)" fill={`url(#side${id})`} opacity={gel ? 0.5 : 0.6} />
      {/* top face */}
      <path d={face} fill={`url(#top${id})`} opacity={gel ? 0.92 : 1} />
      <g clipPath={`url(#clip${id})`}>
        {marks}
        <ellipse cx="150" cy="70" rx="120" ry="34" fill={`url(#gloss${id})`} transform="rotate(-10 150 70)" />
      </g>
      {/* bevel */}
      <path d={face} fill="none" stroke="#fff" strokeOpacity={0.28} strokeWidth={5} />
      <path d={face} fill="none" stroke={deep} strokeOpacity={0.25} strokeWidth={1.5} />

      {/* debossed stamp */}
      <path d={inner} transform="translate(1.6 1.6)" fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={2.4} />
      <path d={inner} fill="none" stroke={deep} strokeOpacity={0.38} strokeWidth={2.4} />
      <g fontFamily="'Titan One', cursive" textAnchor="middle">
        <text x={211.5} y={compact ? 146 : 134.5} fontSize={42} fill="#fff" fillOpacity={0.45}>HERBORA</text>
        <text x={210} y={compact ? 144.5 : 133} fontSize={42} fill={deep} fillOpacity={0.42}>HERBORA</text>
      </g>
      {!compact && (
        <g fontFamily="'Lilita One', cursive" textAnchor="middle" letterSpacing="5">
          <text x={211} y={165} fontSize={15} fill="#fff" fillOpacity={0.45}>{label}</text>
          <text x={210} y={164} fontSize={15} fill={deep} fillOpacity={0.5}>{label}</text>
        </g>
      )}
      {/* tiny leaf mark */}
      <path
        d={compact ? 'M196 168 c6-12 18-16 28-16 -2 10 -12 18 -28 16z' : 'M198 96 c5-9 14-12 22-12 -2 8 -10 14 -22 12z'}
        fill={deep}
        fillOpacity={0.4}
      />
    </svg>
  )
}
