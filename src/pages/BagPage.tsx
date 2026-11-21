import { useEffect, useMemo, useRef, useState } from 'react'
import './bag.css'
import SoapTray from '../components/bag/SoapTray'
import ReceiptPrinter from '../components/bag/ReceiptPrinter'
import EmptyBag from '../components/bag/EmptyBag'
import ContactSheet from '../components/ContactSheet'
import { useBag } from '../lib/bag'
import { navigate, SCROLL_TARGET_KEY } from '../lib/router'
import { openContact } from '../data/contact'

const newOrderId = () => 'HB' + String(Math.floor(10000 + Math.random() * 90000))

export default function BagPage() {
  const { lines, count, subtotal } = useBag()
  const [receipt, setReceipt] = useState<{ id: string; at: Date; snapshot: string } | null>(null)
  const [sealed, setSealed] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  // a fingerprint of the bag; if it changes after printing, the receipt is out of date
  const fingerprint = useMemo(() => lines.map((l) => `${l.soap.id}:${l.qty}`).join('|'), [lines])
  const stale = !!receipt && receipt.snapshot !== fingerprint

  useEffect(() => {
    if (stale) {
      setReceipt(null)
      setSealed(false)
    }
  }, [stale])

  const toShop = (hash?: string) => {
    try { if (hash) sessionStorage.setItem(SCROLL_TARGET_KEY, hash) } catch { /* ignore */ }
    navigate('/')
  }

  const print = () => {
    setSealed(false)
    setReceipt({ id: newOrderId(), at: new Date(), snapshot: fingerprint })
    requestAnimationFrame(() => receiptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const orderMessage = () => {
    const items = lines.map((l) => `• ${l.soap.name} × ${l.qty} — ₹${l.total}`).join('\n')
    return `Hi Herbora! I'd like to place this order (${receipt?.id ?? ''}):\n${items}\n\nSubtotal: ₹${subtotal} + delivery`
  }

  return (
    <main className="bag-page">
      <header className="bag-top">
        <button type="button" className="back-link" onClick={() => toShop()}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Back to the shop
        </button>
        <span className="bag-brand" aria-hidden="true">HERBORA</span>
      </header>

      {count === 0 ? (
        <EmptyBag onShop={() => toShop('#soaps')} />
      ) : (
        <>
          <div className="bag-heading">
            <h1>Your bag</h1>
            <span className="bag-pill">{count} {count === 1 ? 'soap' : 'soaps'}</span>
          </div>

          <div className="bag-grid">
            <SoapTray />

            <aside className="bag-side" ref={receiptRef} aria-label="Order summary">
              {!receipt ? (
                <div className="summary-card">
                  <h2>Summary</h2>
                  <ul>
                    <li><span>Items</span><span>{count}</span></li>
                    <li><span>Subtotal</span><span>&#8377;{subtotal}</span></li>
                    <li><span>Delivery</span><span className="muted">To be confirmed</span></li>
                  </ul>
                  <div className="summary-total">
                    <span>Total</span>
                    <span>&#8377;{subtotal} <small>+ delivery</small></span>
                  </div>
                  <p className="summary-note">Delivery charges depend on your location and are confirmed with your order.</p>
                  <button type="button" className="bag-cta print-btn" onClick={print}>
                    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                      <path d="M7 9V4h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
                      <path d="M7 14h10v6H7z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
                    </svg>
                    Print my receipt
                  </button>
                </div>
              ) : (
                <>
                  <ReceiptPrinter
                    key={receipt.id}
                    lines={lines}
                    count={count}
                    subtotal={subtotal}
                    orderId={receipt.id}
                    printedAt={receipt.at}
                    sealed={sealed}
                    onSealed={() => setSealed(true)}
                  />
                  {sealed && (
                    <div className="sealed-actions" role="status">
                      <p className="sealed-msg">Your order is sealed and ready.</p>
                      <button type="button" className="bag-cta wa" onClick={() => openContact(orderMessage())}>
                        Send order on WhatsApp
                      </button>
                      <button type="button" className="text-btn" onClick={() => { setReceipt(null); setSealed(false) }}>
                        Edit my bag
                      </button>
                    </div>
                  )}
                </>
              )}
            </aside>
          </div>
        </>
      )}
      <ContactSheet />
    </main>
  )
}
