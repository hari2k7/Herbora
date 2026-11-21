import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { seeded, reduceMotion } from '../../lib/util'
import type { Soap } from '../../data/soaps'
import WaxSeal from './WaxSeal'

/**
 * A little thermal printer feeds out the receipt. Pull the paper down and it
 * resists, then tears off along a ragged edge; the printer lifts away and the
 * receipt settles where it was torn. After that the wax seal can be pressed.
 */

type Phase = 'printing' | 'printed' | 'torn'

interface Line { soap: Soap; qty: number; total: number }

interface Props {
  lines: Line[]
  count: number
  subtotal: number
  orderId: string
  printedAt: Date
  sealed: boolean
  onSealed: () => void
}

const TEAR_AT = 150 // px of pull needed to tear

function Barcode({ code }: { code: string }) {
  const bars = useMemo(() => {
    const r = seeded([...code].reduce((a, c) => a * 31 + c.charCodeAt(0), 7))
    const out: { x: number; w: number }[] = []
    let x = 0
    while (x < 220) {
      const w = 1 + Math.floor(r() * 3)
      if (r() > 0.35) out.push({ x, w })
      x += w + 1 + Math.floor(r() * 2)
    }
    return out
  }, [code])
  return (
    <svg className="rc-barcode" viewBox="0 0 220 44" preserveAspectRatio="none" aria-hidden="true">
      {bars.map((b, i) => <rect key={i} x={b.x} y="0" width={b.w} height="44" fill="#2a2a26" />)}
    </svg>
  )
}

/** Paper outline: zigzag bottom always; flat top while attached, ragged top once torn. */
function paperShape(seed: number, torn: boolean) {
  const r = seeded(seed)
  const top: string[] = []
  if (torn) for (let x = 0; x <= 100; x += 2.5) top.push(`${x}% ${(1 + r() * 7).toFixed(1)}px`)
  else top.push('0% 0px', '100% 0px')
  const bottom: string[] = []
  const teeth = 24
  for (let i = teeth * 2; i >= 0; i--) {
    const x = (i / (teeth * 2)) * 100
    bottom.push(`${x.toFixed(2)}% ${i % 2 ? 'calc(100% - 9px)' : '100%'}`)
  }
  return `polygon(${[...top, ...bottom].join(', ')})`
}

export default function ReceiptPrinter({ lines, count, subtotal, orderId, printedAt, sealed, onSealed }: Props) {
  const [phase, setPhase] = useState<Phase>('printing')
  const [fed, setFed] = useState(0)
  const [pull, setPull] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [printerGone, setPrinterGone] = useState(false)
  const paper = useRef<HTMLDivElement>(null)
  const height = useRef(0)
  const drag = useRef<{ y: number; id: number } | null>(null)
  const shapeSeed = Number(orderId.replace(/\D/g, '')) || 5

  useLayoutEffect(() => {
    height.current = paper.current?.offsetHeight ?? 600
  })

  // feed the paper out in little stutters, like a thermal printer
  useEffect(() => {
    if (reduceMotion) {
      setFed(height.current)
      setPhase('printed')
      return
    }
    let raf = 0
    let last = performance.now()
    let t = 0
    let value = 0
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      t += dt
      const burst = Math.sin(t * 13) > -0.2 ? 1 : 0.15
      value = Math.min(height.current, value + dt * 210 * burst)
      setFed(value)
      if (value >= height.current) {
        setPhase('printed')
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const tear = () => {
    if (phase !== 'printed') return
    setPhase('torn')
    setPull(0)
    window.setTimeout(() => setPrinterGone(true), 650)
  }

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== 'printed') return
    drag.current = { y: e.clientY, id: e.pointerId }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* pointer already gone */ }
    setDragging(true)
  }
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.id !== e.pointerId) return
    const dy = Math.max(0, e.clientY - drag.current.y)
    // paper resists more the further you pull
    const resisted = 60 * Math.log1p(dy / 60)
    setPull(resisted)
    if (dy > TEAR_AT) {
      drag.current = null
      setDragging(false)
      tear()
    }
  }
  const onUp = () => {
    if (!drag.current) return
    drag.current = null
    setDragging(false)
    setPull(0) // springs back via CSS transition
  }

  const date = printedAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = printedAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  const torn = phase === 'torn'
  const strain = Math.min(1, pull / (60 * Math.log1p(TEAR_AT / 60)))

  return (
    <div className={'printer-stage' + (torn ? ' is-torn' : '') + (printerGone ? ' printer-gone' : '')}>
      {!printerGone && (
        <div className="printer" aria-hidden="true">
          <div className="printer-top" />
          <div className="printer-body">
            <span className="printer-brand">HERBORA</span>
            <span className={'printer-led' + (phase === 'printing' ? ' busy' : '')} />
          </div>
          <div className="printer-slot" />
        </div>
      )}

      <div
        className={'paper-window' + (dragging ? ' dragging' : '')}
        style={{
          height: torn ? 'auto' : fed,
          transform: torn ? undefined : `translate3d(0, ${pull}px, 0) rotate(${(pull * 0.02).toFixed(2)}deg)`,
          ['--strain' as string]: strain.toFixed(2),
        }}
      >
        <div
          ref={paper}
          className={'paper' + (phase === 'printed' ? ' pullable' : '')}
          style={{ clipPath: paperShape(shapeSeed, torn) }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <header className="rc-head">
            <span className="rc-brand">HERBORA</span>
            <span className="rc-tag">Herbal soaps &middot; hand-pressed</span>
          </header>
          <div className="rc-rule" />
          <div className="rc-meta">
            <span>Order <b>{orderId}</b></span>
            <span>{date}, {time}</span>
          </div>
          <div className="rc-rule" />
          <ul className="rc-lines">
            {lines.map((l) => (
              <li key={l.soap.id}>
                <span className="rc-name">{l.soap.name} <em>&times; {l.qty}</em></span>
                <span className="rc-dots" aria-hidden="true" />
                <span className="rc-amt">&#8377;{l.total}</span>
              </li>
            ))}
          </ul>
          <div className="rc-rule" />
          <ul className="rc-sum">
            <li><span>Items</span><span>{count}</span></li>
            <li><span>Subtotal</span><span>&#8377;{subtotal}</span></li>
            <li><span>Delivery</span><span>To be confirmed</span></li>
          </ul>
          <div className="rc-rule double" />
          <div className="rc-total">
            <span>Total</span>
            <span>&#8377;{subtotal} <small>+ delivery</small></span>
          </div>
          <div className="rc-rule" />
          <Barcode code={orderId} />
          <p className="rc-code">{orderId.split('').join(' ')}</p>
          <p className="rc-thanks">Thank you for choosing nature</p>

          {torn && (
            <div className="rc-seal">
              <WaxSeal sealed={sealed} onSealed={onSealed} />
            </div>
          )}
          <div className="rc-zigzag" aria-hidden="true" />
        </div>
      </div>

      {phase === 'printed' && (
        <button type="button" className="tear-hint" onClick={tear}>
          <span className="tear-arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 4v16M6 14l6 6 6-6" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          Pull the receipt down to tear it off
        </button>
      )}
      {phase === 'printing' && <p className="print-status" role="status">Printing your receipt&hellip;</p>}
    </div>
  )
}
