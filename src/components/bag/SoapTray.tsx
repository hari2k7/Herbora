import { useRef, useState } from 'react'
import SoapBar from '../SoapBar'
import { MAX_BAG_QTY, useBag } from '../../lib/bag'
import type { Soap } from '../../data/soaps'

/**
 * The bag as a wooden soap tray. Each bar sits on its own little dish.
 * + / − pop a few bubbles; drag a soap off the tray (or press Remove) and it
 * dissolves into bubbles before leaving the bag.
 */

const REMOVE_DISTANCE = 110

function Pops({ pops }: { pops: number[] }) {
  return (
    <span className="pops" aria-hidden="true">
      {pops.map((id) => (
        <span key={id} className="pop-set">
          {[0, 1, 2, 3, 4].map((i) => <i key={i} style={{ ['--a' as string]: `${i * 72 + (id % 40)}deg` }} />)}
        </span>
      ))}
    </span>
  )
}

function TrayItem({ soap, qty, total, index }: { soap: Soap; qty: number; total: number; index: number }) {
  const { setQty, remove } = useBag()
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [dissolving, setDissolving] = useState(false)
  const [pops, setPops] = useState<number[]>([])
  const start = useRef<{ x: number; y: number; id: number } | null>(null)

  const pop = () => {
    const id = Date.now() + Math.random()
    setPops((p) => [...p, id])
    window.setTimeout(() => setPops((p) => p.filter((x) => x !== id)), 700)
  }

  const dissolve = () => {
    if (dissolving) return
    setDissolving(true)
    window.setTimeout(() => remove(soap.id), 650)
  }

  const change = (n: number) => {
    if (n <= 0) return dissolve()
    pop()
    setQty(soap.id, n)
  }

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dissolving) return
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* pointer already gone */ }
    setDragging(true)
  }
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!start.current || start.current.id !== e.pointerId) return
    setDx(e.clientX - start.current.x)
  }
  const onUp = () => {
    if (!start.current) return
    start.current = null
    setDragging(false)
    if (Math.abs(dx) > REMOVE_DISTANCE) dissolve()
    else setDx(0)
  }

  const away = Math.min(1, Math.abs(dx) / REMOVE_DISTANCE)

  return (
    <li
      className={'tray-item' + (dissolving ? ' dissolving' : '')}
      style={{ ['--away' as string]: away.toFixed(3), animationDelay: `${index * 70}ms` }}
    >
      <div
        className={'dish' + (dragging ? ' dragging' : '') + (away >= 1 ? ' will-remove' : '')}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="img"
        aria-label={`${soap.name} soap. Drag sideways off the tray to remove.`}
      >
        <div className="dish-plate" aria-hidden="true" />
        <div className="dish-soap" style={{ transform: `translate3d(${dx}px, ${-Math.abs(dx) * 0.08}px, 0) rotate(${dx * 0.06}deg)` }}>
          <SoapBar soap={soap} seed={index + 1} compact />
        </div>
        {dissolving && (
          <span className="dissolve-bubbles" aria-hidden="true" style={{ transform: `translateX(${dx}px)` }}>
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} style={{ ['--a' as string]: `${i * 30}deg`, ['--d' as string]: `${30 + (i % 4) * 14}px`, ['--s' as string]: `${8 + (i % 3) * 6}px` }} />
            ))}
          </span>
        )}
      </div>

      <div className="tray-info">
        <h3 style={{ color: soap.deep }}>{soap.name}</h3>
        <p className="tray-latin">{soap.latin}</p>
        <p className="tray-unit">&#8377;{soap.price} / {soap.unit}</p>
      </div>

      <div className="stepper" role="group" aria-label={`${soap.name} quantity`}>
        <button type="button" onClick={() => change(qty - 1)} aria-label={qty === 1 ? `Remove ${soap.name}` : `One less ${soap.name}`} disabled={dissolving}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 12h12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
        </button>
        <span className="qty" aria-live="polite">{qty}</span>
        <button type="button" onClick={() => change(qty + 1)} aria-label={`One more ${soap.name}`} disabled={dissolving || qty >= MAX_BAG_QTY}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
        </button>
        <Pops pops={pops} />
      </div>

      <div className="tray-total">
        <strong>&#8377;{total}</strong>
        <button type="button" className="tray-remove" onClick={dissolve} disabled={dissolving}>Remove</button>
      </div>
    </li>
  )
}

export default function SoapTray() {
  const { lines } = useBag()
  return (
    <section className="tray" aria-label="Soaps in your bag">
      <div className="tray-wood" aria-hidden="true" />
      <ul className="tray-list">
        {lines.map((l, i) => (
          <TrayItem key={l.soap.id} soap={l.soap} qty={l.qty} total={l.total} index={i} />
        ))}
      </ul>
      <p className="tray-hint">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Drag a soap off the tray to remove it
      </p>
    </section>
  )
}
