import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import BagButton from './components/BagButton'
import Hero from './components/Hero'
import type { Soap } from './data/soaps'

// GSAP, Lenis and every section below the hero arrive in a second chunk,
// so the hero paints as soon as the small first bundle runs.
const Below = lazy(() => import('./Below'))

export default function App() {
  const [bag, setBag] = useState<Record<string, number>>({})
  const [bump, setBump] = useState(0)
  const [toast, setToast] = useState<{ id: number; text: string; color: string } | null>(null)
  const bagRef = useRef<HTMLButtonElement>(null)
  const count = Object.values(bag).reduce((a, b) => a + b, 0)

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  const onAdd = useCallback((soap: Soap) => {
    setBag((b) => ({ ...b, [soap.id]: (b[soap.id] ?? 0) + 1 }))
    setToast({ id: Date.now(), text: `${soap.name} soap is in your bag`, color: soap.color })
  }, [])
  const onArrive = useCallback(() => setBump((n) => n + 1), [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(t)
  }, [toast])

  return (
    <>
      <BagButton ref={bagRef} count={count} bump={bump} />
      <main>
        <Hero />
        <Suspense fallback={<div className="below-ph" aria-hidden="true" />}>
          <Below bagRef={bagRef} onAdd={onAdd} onArrive={onArrive} />
        </Suspense>
      </main>
      <div className="toast-wrap" aria-live="polite">
        {toast && (
          <div className="toast" key={toast.id} style={{ ['--c' as string]: toast.color }}>
            <span className="toast-dot" />
            {toast.text}
          </div>
        )}
      </div>
    </>
  )
}
