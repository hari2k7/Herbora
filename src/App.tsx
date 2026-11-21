import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import BagButton from './components/BagButton'
import Hero from './components/Hero'
import type { Soap } from './data/soaps'
import { BagProvider, useBag } from './lib/bag'
import { navigate, usePath } from './lib/router'

// GSAP, Lenis and every section below the hero arrive in a second chunk,
// so the hero paints as soon as the small first bundle runs.
const Below = lazy(() => import('./Below'))
const BagPage = lazy(() => import('./pages/BagPage'))

function Shell() {
  const path = usePath()
  const onBag = path === '/bag'
  const { count, add } = useBag()
  const [bump, setBump] = useState(0)
  const [toast, setToast] = useState<{ id: number; text: string; color: string } | null>(null)
  const bagRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  }, [])

  // every page change starts at the top (the soap link jumps to the collection itself)
  useEffect(() => {
    document.title = onBag ? 'Your bag — Herbora' : 'Herbora — Herbal soaps, hand-pressed from Indian gardens'
    import('./lib/motion').then(({ getLenis }) => {
      const lenis = getLenis()
      if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
      else window.scrollTo(0, 0)
    })
  }, [onBag])

  const onAdd = useCallback((soap: Soap) => {
    add(soap.id)
    setToast({ id: Date.now(), text: `${soap.name} soap is in your bag`, color: soap.color })
  }, [add])
  const onArrive = useCallback(() => setBump((n) => n + 1), [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(t)
  }, [toast])

  return (
    <>
      {!onBag && <BagButton ref={bagRef} count={count} bump={bump} onClick={() => navigate('/bag')} />}
      {onBag ? (
        <Suspense fallback={<div className="bag-ph" aria-hidden="true" />}>
          <BagPage />
        </Suspense>
      ) : (
        <main>
          <Hero />
          <Suspense fallback={<div className="below-ph" aria-hidden="true" />}>
            <Below bagRef={bagRef} onAdd={onAdd} onArrive={onArrive} />
          </Suspense>
        </main>
      )}
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

export default function App() {
  return (
    <BagProvider>
      <Shell />
    </BagProvider>
  )
}
