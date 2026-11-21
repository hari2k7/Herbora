/**
 * Hand-drawn, engraving-style herb illustrations for the footer.
 * All drawn procedurally in cream with ink outlines and hatching.
 */
import { seeded } from '../lib/util'

const CREAM = '#ece5d3'
const CREAM_D = '#d6ccb4'
const INK = '#26322a'

const ink = { stroke: INK, strokeWidth: 1.8, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
const hatch = { stroke: INK, strokeWidth: 0.9, strokeLinecap: 'round' as const, opacity: 0.6, fill: 'none' }

/* ---------------- Neem: pinnate sprig of sickle-shaped, serrated leaflets ---------------- */
function neemLeaflet(len: number, wid: number) {
  // pointing along +x, slightly sickle-curved, serrated upper edge
  let top = 'M0 0'
  const steps = 9
  for (let i = 1; i <= steps; i++) {
    const s = i / steps
    const x = s * len
    const y = -Math.sin(Math.PI * Math.pow(s, 0.8)) * wid + s * s * wid * 0.6
    const tooth = i < steps ? -2.2 : 0
    top += ` L${(x - len / steps / 2).toFixed(1)} ${(y + tooth).toFixed(1)} L${x.toFixed(1)} ${y.toFixed(1)}`
  }
  let bottom = ''
  for (let i = steps - 1; i >= 0; i--) {
    const s = i / steps
    const x = s * len
    const y = Math.sin(Math.PI * Math.pow(s, 0.8)) * wid * 0.75 + s * s * wid * 0.6
    bottom += ` L${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return top + bottom + ' Z'
}

export function Neem() {
  const P0 = [20, 190], P1 = [70, 70], P2 = [210, 30]
  const at = (t: number) => {
    const u = 1 - t
    const x = u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0]
    const y = u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1]
    const dx = 2 * u * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0])
    const dy = 2 * u * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1])
    return { x, y, a: (Math.atan2(dy, dx) * 180) / Math.PI }
  }
  const leaves: React.ReactNode[] = []
  const N = 7
  for (let k = 0; k < N; k++) {
    const t = 0.2 + (k / N) * 0.72
    const { x, y, a } = at(t)
    const len = 58 - k * 3.5
    const wid = 9.5 - k * 0.4
    for (const side of [-1, 1]) {
      const rot = a + side * 52
      leaves.push(
        <g key={`${k}${side}`} transform={`translate(${x} ${y}) rotate(${rot}) scale(1 ${side})`}>
          <path d={neemLeaflet(len, wid)} fill={CREAM} {...ink} strokeWidth={1.5} />
          <path d={`M2 0 Q${len * 0.5} ${wid * 0.15} ${len - 2} ${wid * 0.55}`} {...hatch} opacity={0.85} />
          {[0.3, 0.45, 0.6, 0.75].map((s) => (
            <path key={s} d={`M${len * s} ${wid * 0.15 + 1} l${len * 0.06} ${wid * 0.45}`} {...hatch} />
          ))}
        </g>,
      )
    }
  }
  const tip = at(1)
  return (
    <svg viewBox="0 0 240 210" className="herb-svg">
      <path d={`M${P0[0]} ${P0[1]} Q${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}`} fill="none" {...ink} strokeWidth={3.4} />
      <path d={`M${P0[0]} ${P0[1]} Q${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}`} fill="none" stroke={CREAM} strokeWidth={1.4} />
      {leaves}
      <g transform={`translate(${tip.x} ${tip.y}) rotate(${tip.a})`}>
        <path d={neemLeaflet(46, 8.5)} fill={CREAM} {...ink} strokeWidth={1.5} />
        <path d="M2 0 Q23 1 44 4" {...hatch} opacity={0.85} />
      </g>
    </svg>
  )
}

/* ---------------- Sandalwood: a little pile of cut logs ---------------- */
function Log({ x, y, rot, len, r, seed }: { x: number; y: number; rot: number; len: number; r: number; seed: number }) {
  const rnd = seeded(seed)
  const bark: React.ReactNode[] = []
  for (let i = 0; i < 9; i++) {
    const yy = -r + 4 + rnd() * (2 * r - 8)
    const x0 = r * 0.5 + rnd() * len * 0.5
    const l = 16 + rnd() * len * 0.4
    bark.push(<path key={i} d={`M${x0} ${yy} q${l / 2} ${(rnd() - 0.5) * 3} ${l} 0`} {...hatch} />)
  }
  // shading strokes on the lower side
  for (let i = 0; i < 12; i++) {
    const xx = r * 0.6 + (i / 12) * len
    bark.push(<path key={'s' + i} d={`M${xx} ${r * 0.45} l3 ${r * 0.5}`} {...hatch} />)
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M0 ${-r} L${len} ${-r} A${r * 0.42} ${r} 0 0 1 ${len} ${r} L0 ${r} Z`} fill={CREAM} {...ink} />
      {bark}
      <ellipse cx="0" cy="0" rx={r * 0.42} ry={r} fill={CREAM_D} {...ink} />
      {[0.72, 0.48, 0.26].map((k) => (
        <ellipse key={k} cx="0" cy="0" rx={r * 0.42 * k} ry={r * k} {...hatch} opacity={0.75} />
      ))}
      <path d={`M0 0 l${r * 0.25} ${r * 0.5}`} {...hatch} />
    </g>
  )
}

export function Sandal() {
  return (
    <svg viewBox="0 0 250 170" className="herb-svg">
      <Log x={46} y={118} rot={-6} len={170} r={22} seed={3} />
      <Log x={30} y={78} rot={8} len={150} r={19} seed={9} />
      <Log x={92} y={52} rot={-18} len={120} r={16} seed={14} />
      {/* fragrant curls */}
      <g {...hatch} opacity={0.9} strokeWidth={1.3}>
        <path d="M205 40 c-10 -10 8 -16 0 -28" />
        <path d="M222 50 c-8 -9 9 -15 2 -26" />
      </g>
    </svg>
  )
}

/* ---------------- Aloe vera: spiky rosette in a little pot ---------------- */
function aloeLeaf(L: number, w: number, bend: number) {
  return `M${-w} 0 Q${-w * 0.9 + bend * 0.35} ${-L * 0.6} ${bend} ${-L} Q${w * 0.9 + bend * 0.5} ${-L * 0.5} ${w} 0 Z`
}

export function Aloe() {
  const leaves = [
    { a: -58, L: 105, w: 12, b: -18 },
    { a: 56, L: 110, w: 12, b: 20 },
    { a: -32, L: 135, w: 14, b: -14 },
    { a: 30, L: 140, w: 14, b: 16 },
    { a: -10, L: 150, w: 15, b: -8 },
    { a: 12, L: 142, w: 14, b: 10 },
  ]
  return (
    <svg viewBox="0 0 220 250" className="herb-svg">
      {leaves.map((l, i) => {
        const teeth: React.ReactNode[] = []
        for (let k = 1; k < 9; k++) {
          const s = k / 10
          const xl = -l.w * (1 - s) + l.b * s * s
          const y = -l.L * s
          teeth.push(<path key={'l' + k} d={`M${xl} ${y} l-4 -2`} {...ink} strokeWidth={1.2} />)
          teeth.push(<path key={'r' + k} d={`M${l.w * (1 - s) + l.b * s * s} ${y} l4 -2`} {...ink} strokeWidth={1.2} />)
        }
        return (
          <g key={i} transform={`translate(110 178) rotate(${l.a})`}>
            <path d={aloeLeaf(l.L, l.w, l.b)} fill={CREAM} {...ink} />
            {teeth}
            <path d={`M0 -4 Q${l.b * 0.3} ${-l.L * 0.55} ${l.b * 0.9} ${-l.L * 0.92}`} {...hatch} />
            {[0.25, 0.42, 0.6].map((s) => (
              <ellipse key={s} cx={-l.w * 0.4 * (1 - s) + l.b * s * s} cy={-l.L * s} rx={1.8} ry={3.4} {...hatch} />
            ))}
          </g>
        )
      })}
      {/* pot */}
      <path d="M62 176 H158 L148 238 H72 Z" fill={CREAM} {...ink} />
      <rect x="56" y="168" width="108" height="16" rx="4" fill={CREAM_D} {...ink} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path key={i} d={`M${128 + i * 3.4} ${188} L${124 + i * 3} ${236}`} {...hatch} />
      ))}
    </svg>
  )
}

/* ---------------- Kuppaimeni (Acalypha indica): sprig with scalloped ovate leaves ---------------- */
function ovateLeaf(L: number, W: number) {
  const pts: string[] = []
  const N = 26
  for (let i = 0; i <= N; i++) {
    const s = i / N
    const hw = W * Math.sin(Math.PI * Math.pow(s, 0.75)) * (1 - 0.25 * s) * (1 + 0.07 * Math.sin(s * 42))
    pts.push(`${hw.toFixed(1)} ${(-L * s).toFixed(1)}`)
  }
  for (let i = N; i >= 0; i--) {
    const s = i / N
    const hw = W * Math.sin(Math.PI * Math.pow(s, 0.75)) * (1 - 0.25 * s) * (1 + 0.07 * Math.sin(s * 42 + 1))
    pts.push(`${(-hw).toFixed(1)} ${(-L * s).toFixed(1)}`)
  }
  return 'M' + pts.join(' L') + ' Z'
}

export function Kuppaimeni() {
  const nodes = [
    { y: 190, a: -62, L: 62, W: 28 },
    { y: 160, a: 58, L: 58, W: 26 },
    { y: 128, a: -54, L: 52, W: 23 },
    { y: 98, a: 50, L: 46, W: 20 },
    { y: 70, a: -44, L: 38, W: 17 },
    { y: 46, a: 38, L: 30, W: 13 },
  ]
  const stemX = (y: number) => 100 + Math.sin(y / 40) * 8
  return (
    <svg viewBox="0 0 210 250" className="herb-svg">
      <path d={`M${stemX(240)} 240 ${[200, 160, 120, 80, 40, 18].map((y) => `L${stemX(y).toFixed(1)} ${y}`).join(' ')}`} fill="none" {...ink} strokeWidth={4.4} />
      <path d={`M${stemX(240)} 240 ${[200, 160, 120, 80, 40, 18].map((y) => `L${stemX(y).toFixed(1)} ${y}`).join(' ')}`} fill="none" stroke={CREAM} strokeWidth={1.6} strokeLinejoin="round" />
      {nodes.map((n, i) => {
        const sx = stemX(n.y)
        const side = n.a < 0 ? -1 : 1
        return (
          <g key={i}>
            {/* tiny flower spike in the axil */}
            <path d={`M${sx} ${n.y} q${-side * 4} -14 ${-side * 2} -22`} fill="none" {...ink} strokeWidth={1.2} />
            {[4, 9, 14, 19].map((d) => (
              <circle key={d} cx={sx - side * (2 + d * 0.05)} cy={n.y - d} r={1.6} fill={INK} opacity={0.7} />
            ))}
            <g transform={`translate(${sx} ${n.y}) rotate(${n.a})`}>
              <path d={`M0 0 L0 ${-n.L * 0.35}`} {...ink} strokeWidth={1.6} />
              <g transform={`translate(0 ${-n.L * 0.33})`}>
                <path d={ovateLeaf(n.L, n.W)} fill={CREAM} {...ink} strokeWidth={1.5} />
                <path d={`M0 0 L0 ${-n.L * 0.92}`} {...hatch} opacity={0.85} />
                {[0.2, 0.38, 0.56, 0.72].map((s) => (
                  <g key={s}>
                    <path d={`M0 ${-n.L * s} q${n.W * 0.35} ${-n.L * 0.06} ${n.W * 0.62} ${-n.L * 0.16}`} {...hatch} />
                    <path d={`M0 ${-n.L * s} q${-n.W * 0.35} ${-n.L * 0.06} ${-n.W * 0.62} ${-n.L * 0.16}`} {...hatch} />
                  </g>
                ))}
              </g>
            </g>
          </g>
        )
      })}
      <g transform={`translate(${stemX(18)} 18)`}>
        <path d={ovateLeaf(22, 10)} fill={CREAM} {...ink} strokeWidth={1.4} />
      </g>
    </svg>
  )
}

/* ---------------- Turmeric: knobbly rhizome fingers with growth rings ---------------- */
export function Turmeric() {
  const fingers = [
    { x: 70, y: 100, rot: -8, l: 120, r: 22 },
    { x: 110, y: 92, rot: -58, l: 70, r: 15 },
    { x: 140, y: 102, rot: 30, l: 62, r: 14 },
    { x: 92, y: 110, rot: 64, l: 48, r: 13 },
    { x: 60, y: 96, rot: -130, l: 46, r: 13 },
  ]
  return (
    <svg viewBox="0 0 240 190" className="herb-svg">
      {fingers.map((f, i) => (
        <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${f.rot})`}>
          <rect x={-f.r} y={-f.r} width={f.l} height={f.r * 2} rx={f.r} fill={CREAM} {...ink} />
          {Array.from({ length: Math.floor(f.l / 14) }, (_, k) => (
            <path key={k} d={`M${k * 14 + 2} ${-f.r + 3} q4 ${f.r} 0 ${f.r * 2 - 6}`} {...hatch} />
          ))}
          <path d={`M${f.l - f.r * 2} ${f.r * 0.5} l${f.r * 0.6} 0`} {...hatch} />
          {/* root hairs */}
          {[0.3, 0.55].map((s) => (
            <path key={s} d={`M${f.l * s} ${f.r} q2 8 -3 14`} fill="none" {...ink} strokeWidth={1} />
          ))}
        </g>
      ))}
      {/* a sliced coin showing the cut face */}
      <g transform="translate(196 150)">
        <ellipse rx="22" ry="20" fill={CREAM_D} {...ink} />
        <ellipse rx="14" ry="12.5" {...hatch} />
        {Array.from({ length: 10 }, (_, i) => (
          <circle key={i} cx={Math.cos(i * 0.63) * 8} cy={Math.sin(i * 0.63) * 7} r={1} fill={INK} opacity={0.6} />
        ))}
      </g>
    </svg>
  )
}

/* ---------------- Mortar & pestle with leaves peeking out ---------------- */
export function Mortar() {
  return (
    <svg viewBox="0 0 220 200" className="herb-svg">
      {/* pestle */}
      <g transform="translate(140 40) rotate(28)">
        <rect x="-11" y="-30" width="22" height="120" rx="11" fill={CREAM} {...ink} />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M${4 + i * 1.6} -22 L${4 + i * 1.6} 80`} {...hatch} />
        ))}
      </g>
      {/* leaves inside */}
      {[-40, -10, 20].map((a, i) => (
        <g key={i} transform={`translate(${82 + i * 22} 96) rotate(${a - 70})`}>
          <path d={neemLeaflet(40, 8)} fill={CREAM} {...ink} strokeWidth={1.4} />
          <path d="M2 0 Q20 1 38 4" {...hatch} />
        </g>
      ))}
      {/* bowl */}
      <path d="M28 104 Q30 178 110 182 Q190 178 192 104 Z" fill={CREAM} {...ink} />
      <ellipse cx="110" cy="104" rx="82" ry="14" fill={CREAM_D} {...ink} />
      <ellipse cx="110" cy="106" rx="68" ry="8" {...hatch} />
      {Array.from({ length: 11 }, (_, i) => (
        <path key={i} d={`M${140 + i * 4.5} ${118 + i * 0.6} Q${146 + i * 3.6} ${150} ${136 + i * 3.2} ${176 - i * 0.6}`} {...hatch} />
      ))}
      <path d="M78 182 L74 194 H146 L142 182" fill={CREAM_D} {...ink} />
    </svg>
  )
}

/* ---------------- Pink stamp badge ---------------- */
export function Badge() {
  const N = 22
  const pts: string[] = []
  for (let i = 0; i <= 220; i++) {
    const a = (i / 220) * Math.PI * 2
    const r = 92 + Math.sin(a * N) * 4.5
    pts.push(`${(100 + Math.cos(a) * r).toFixed(2)} ${(100 + Math.sin(a) * r).toFixed(2)}`)
  }
  return (
    <svg viewBox="0 0 200 200" className="herb-svg badge-svg">
      <path d={'M' + pts.join(' L') + 'Z'} fill="#c85878" stroke="#8a2b4a" strokeWidth="3" />
      <circle cx="100" cy="100" r="74" fill="none" stroke="#8a2b4a" strokeWidth="2.4" strokeDasharray="2 6" strokeLinecap="round" />
      <g fontFamily="'Lilita One', cursive" textAnchor="middle" fill="#3b1022">
        <text x="100" y="94" fontSize="42" transform="rotate(-8 100 100)">PURE</text>
        <text x="100" y="134" fontSize="42" transform="rotate(-8 100 100)">HERBS</text>
      </g>
      <g fill="#3b1022">
        <circle cx="62" cy="156" r="3" /><circle cx="100" cy="164" r="3" /><circle cx="138" cy="152" r="3" />
      </g>
    </svg>
  )
}
