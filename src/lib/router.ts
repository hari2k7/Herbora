import { useEffect, useState } from 'react'

/**
 * A tiny client-side router: two pages ("/" and "/bag") don't need a library.
 * navigate() pushes a history entry; the Back button works via popstate.
 */

const EVENT = 'herbora:navigate'

export function navigate(path: string, opts: { hash?: string } = {}) {
  const url = path + (opts.hash ?? '')
  if (location.pathname + location.hash === url) return
  history.pushState({}, '', url)
  window.dispatchEvent(new Event(EVENT))
}

export function usePath() {
  const [path, setPath] = useState(() => location.pathname)
  useEffect(() => {
    const update = () => setPath(location.pathname)
    window.addEventListener('popstate', update)
    window.addEventListener(EVENT, update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener(EVENT, update)
    }
  }, [])
  return path
}
export const SCROLL_TARGET_KEY = 'herbora-scroll-to'
