import { createRoot, hydrateRoot } from 'react-dom/client'
import '@fontsource/titan-one/latin-400.css'
import '@fontsource/lilita-one/latin-400.css'
import './styles.css'
import App from './App'

const root = document.getElementById('root')!

// The landing page HTML is pre-rendered at build time (see vite.config.ts), so the hero
// shows before any JavaScript runs; React then "hydrates" it instead of re-drawing it.
// Other paths (like /bag) get the same HTML file, so they start fresh.
const hydrate = () =>
  hydrateRoot(root, <App hydrating />, {
    // The lazily loaded sections are intentionally left as placeholders in the pre-rendered
    // HTML; React reports that as "switched to client rendering" (#419). It's expected here.
    onRecoverableError(error) {
      const msg = String((error as Error)?.message ?? error)
      if (msg.includes('#419') || msg.includes('could not finish this Suspense boundary')) return
      console.error(error)
    },
  })

if (root.hasChildNodes() && location.pathname === '/') {
  // The hero is already on screen as plain HTML, so let the browser paint it first and
  // start React right after, when it's idle (or within half a second at most).
  if ('requestIdleCallback' in window) window.requestIdleCallback(hydrate, { timeout: 500 })
  else globalThis.setTimeout(hydrate, 50)
} else {
  root.textContent = ''
  createRoot(root).render(<App />)
}
