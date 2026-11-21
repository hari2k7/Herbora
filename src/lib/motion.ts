import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }

export { reduceMotion } from './util'

let lenis: Lenis | null = null

export function initLenis() {
  if (lenis) return lenis
  // lerp-based smoothing: responsive, no long "floaty" tail
  lenis = new Lenis({ lerp: 0.12, smoothWheel: true, autoRaf: false })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis?.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
  return lenis
}

export function getLenis() {
  return lenis
}

export function scrollToTarget(target: string | number | HTMLElement, duration = 1.6) {
  if (lenis) {
    lenis.scrollTo(target, { duration })
    return
  }
  if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'smooth' })
  else {
    const el = typeof target === 'string' ? document.querySelector(target) : target
    el?.scrollIntoView({ behavior: 'smooth' })
  }
}

/** Split the text nodes of an element into word spans (keeps <br> and inline tags). */
export function splitWords(root: HTMLElement) {
  if (root.dataset.split === '1') return
  root.dataset.split = '1'
  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? ''
        if (!text.trim()) return
        const frag = document.createDocumentFragment()
        text.split(/(\s+)/).forEach((part) => {
          if (!part) return
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(' '))
          else {
            const span = document.createElement('span')
            span.className = 'w'
            span.textContent = part
            frag.appendChild(span)
          }
        })
        child.replaceWith(frag)
      } else if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName !== 'BR') {
        walk(child)
      }
    })
  }
  walk(root)
}
