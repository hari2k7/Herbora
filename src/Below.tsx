import { useEffect, useLayoutEffect, useState, type RefObject } from 'react'
import Marquee from './components/Marquee'
import SoapShowcase from './components/SoapShowcase'
import GrassQuote from './components/GrassQuote'
import Footer from './components/Footer'
import BackToTop from './components/BackToTop'
import type { Soap } from './data/soaps'
import { gsap, initLenis, reduceMotion, ScrollTrigger } from './lib/motion'
import { SCROLL_TARGET_KEY } from './lib/router'

interface Props {
  bagRef: RefObject<HTMLButtonElement | null>
  onAdd: (soap: Soap) => void
  onArrive: () => void
}

/**
 * Everything below the hero, plus smooth scrolling and GSAP. Loaded as a separate
 * chunk so the hero can paint before the animation libraries download.
 */
export default function Below({ bagRef, onAdd, onArrive }: Props) {
  // the grass section and footer are far down the page — mount them once the browser is idle
  const [late, setLate] = useState(false)

  useLayoutEffect(() => {
    initLenis()
    if (reduceMotion) return
    // gentle hero parallax
    const ctx = gsap.context(() => {
      const st = { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
      gsap.to('.hero-copy', { yPercent: -35, ease: 'none', scrollTrigger: st })
    })
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    // one refresh once web fonts have settled (text metrics change pin spacing)
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    const show = () => setLate(true)
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(show, { timeout: 1500 })
      return () => window.cancelIdleCallback(id)
    }
    const t = globalThis.setTimeout(show, 700)
    return () => globalThis.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (late) requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [late])

  // coming back from the bag page with "Meet the bars": land on the collection
  useEffect(() => {
    let target: string | null = null
    try {
      target = sessionStorage.getItem(SCROLL_TARGET_KEY)
      sessionStorage.removeItem(SCROLL_TARGET_KEY)
    } catch { /* ignore */ }
    if (!target) return
    const t = globalThis.setTimeout(() => {
      ScrollTrigger.refresh()
      const el = document.querySelector(target!)
      if (el) initLenis().scrollTo(el as HTMLElement, { immediate: true, force: true })
    }, 350)
    return () => globalThis.clearTimeout(t)
  }, [])

  const add = (soap: Soap, from: HTMLElement) => {
    onAdd(soap)
    // a little soap drop flies into the bag
    const target = bagRef.current
    if (!target) return
    const a = from.getBoundingClientRect()
    const b = target.getBoundingClientRect()
    const drop = document.createElement('div')
    drop.className = 'fly-drop'
    drop.style.background = soap.color
    drop.style.left = a.left + a.width / 2 + 'px'
    drop.style.top = a.top + a.height / 2 + 'px'
    document.body.appendChild(drop)
    const dx = b.left + b.width / 2 - (a.left + a.width / 2)
    const dy = b.top + b.height / 2 - (a.top + a.height / 2)
    gsap.timeline({ onComplete: () => { drop.remove(); onArrive() } })
      .fromTo(drop, { x: 0 }, { x: dx, duration: 0.8, ease: 'power1.inOut' }, 0)
      .fromTo(drop, { y: 0 }, { y: dy, duration: 0.8, ease: 'back.in(1.6)' }, 0)
      .fromTo(drop, { scale: 1 }, { scale: 0.3, duration: 0.8, ease: 'power2.in' }, 0)
  }

  return (
    <>
      <Marquee />
      <SoapShowcase onAdd={add} />
      {late ? <GrassQuote /> : <div className="quote-ph" aria-hidden="true" />}
      {late ? <Footer /> : <div className="footer-ph" aria-hidden="true" />}
      <BackToTop />
    </>
  )
}
