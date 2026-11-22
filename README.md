# Herbora

A premium, motion-rich storefront for **Herbora**, a small-batch herbal soap brand. Built with **React + TypeScript** to showcase interaction design, animation and front-end performance work — every soap, herb, ripple and receipt on the page is drawn in code, with **no image files at all**.

> Cold-processed in small batches with **pure coconut oil** and cured for six slow weeks.

---

## Highlights

### Landing page
| Section | What happens |
|---|---|
| **Hero** | Full-bleed clear water rendered by a tiny **WebGL caustics shader** (perspective-projected, animated light over pale sand). Realistic soap bars float on the surface with soft shadows, ripple rings and lather; neem leaves drift past. The **HERBORA** letters wobble like jelly when hovered. |
| **Marquee** | A tilted ribbon that speeds up and reverses with your scroll velocity. |
| **The collection** | A pinned, scroll-driven showcase of **nine soaps**. Each bar swings in on a curve while a **canvas bubble system** trails behind it — the faster you scroll, the more bubbles. The background tints to each soap, the name scrolls behind in giant outline type, and the scroll snaps neatly on every bar. |
| **Add to bag** | The button fills with rising foam on hover; clicking pops a ring of bubbles, draws a tick, and flies a little soap drop into the bag counter. |
| **Quote** | “Rooted in soil, rinsed in rain.” over a sky, with a furry ribbon of **thousands of canvas-drawn grass blades** that part around your cursor and spring back. |
| **Footer** | A giant wordmark dressed with **hand-drawn, engraving-style herbs** (neem, aloe vera, kuppaimeni, sandalwood, coconut, mortar & pestle) that shy away from the cursor and hop when tapped. |

### Bag page (`/bag`)
- **Soap tray** — items sit on ceramic dishes in a wooden tray. `−`/`+` pop bubbles; **drag a soap off the tray** and it dissolves into bubbles.
- **Receipt printer** — “Print my receipt” feeds a thermal receipt out of a little printer. **Pull the paper down**: it resists, then **tears off** along a ragged edge, the printer lifts away and the receipt stays.
- **Wax seal** — **press & hold** to fill a ring; at 100 % a green wax seal stamps down to confirm the order.
- **Empty state** — an empty soap dish with one lonely bubble floating up.
- **Persistent bag** — saved in `localStorage`, synced across tabs.

---

## Tech stack

- **React 19** + **TypeScript** + **Vite**
- **GSAP** + **ScrollTrigger** — scroll choreography and pinning
- **Lenis** — smooth scrolling
- **WebGL** (raw, no library) — water caustics shader
- **Canvas 2D** — bubbles and grass
- **SVG** — soaps, herbs, printer, wax seal
- **Vercel Functions** — `/api/contact`
- Self-hosted fonts via **@fontsource** — *Titan One* (brand) and *Lilita One* (everything else)

No UI or router libraries — a ~30-line router (`src/lib/router.ts`) handles the two pages.

---

## Performance

The site was profiled with Lighthouse and Chrome traces and tuned so the effects stay smooth on phones.

**Lighthouse (production build, `npm run build && npm run preview`):**

| | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| Mobile — landing | 94–96 | 100 | 100 | 100 |
| Mobile — bag page | 98 | 100 | 100 | 100 |
| Desktop — landing | 100 | 100 | 100 | 100 |

> Measure the production build — the dev server (`npm run dev`) is unoptimised and always scores much lower.

- **Pre-rendered hero**: at build time the landing page is rendered to HTML (`vite.config.ts` → `entry-server.tsx`), its CSS is inlined and the title font embedded, so the hero paints before any JavaScript runs; React hydrates it once the browser is idle.
- **Code-split**: the first bundle is just React + the hero; GSAP, Lenis and every section below the fold arrive in a second chunk, and the bag page is its own chunk.
- **Compositor-only motion** where possible (`transform` / `opacity`), no filters on moving elements, no CSS variables inside keyframes.
- GSAP tweens use explicit `fromTo` values so scrolling never forces a full-page style recalculation.
- Canvases render at reduced pixel ratio, **pause when off-screen**, and the grass drops to 30 fps when nobody is touching it.
- The WebGL water renders at ~60 % resolution and 30 fps, starts after first paint, and draws a single still frame on software-only GPUs.
- The grass, reviews and footer mount one at a time in idle moments, so no single long task blocks taps or scrolling.
- The soap grain texture is generated once, encoded off the main thread and shared by every bar through one SVG pattern.
- Hover effects only run on devices with a real mouse, so taps on phones never leave buttons stuck mid-animation.
- `prefers-reduced-motion` is respected throughout.

---

## Getting started

Requires **Node.js 20.19+ or 22.12+** (Vite 8).

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally
```

---

## Project structure

```
api/
  contact.ts            Vercel function: validates enquiries, forwards to WhatsApp
src/
  App.tsx               Page switch (landing / bag), bag button, toasts
  Below.tsx             Everything below the hero (lazy chunk) + Lenis setup
  main.tsx              Entry, fonts, global styles
  styles.css            Landing page styles
  components/
    Hero.tsx  Pond.tsx  WaterGL.tsx     Hero, floating soaps, WebGL water
    SoapShowcase.tsx  SoapBar.tsx       Pinned collection, realistic soap bars
    AddButton.tsx  BagButton.tsx  BackToTop.tsx  Marquee.tsx  WobbleText.tsx
    GrassQuote.tsx                      Canvas grass ribbon
    Footer.tsx  Herbs.tsx               Wordmark footer and herb illustrations
    ContactSheet.tsx                    Message popup
    bag/  SoapTray  ReceiptPrinter  WaxSeal  EmptyBag
  pages/
    BagPage.tsx  bag.css
  data/
    soaps.ts            The nine soaps: copy, prices, colours, textures
    contact.ts          Popup text + CONTACT_ENABLED switch
  lib/
    bag.tsx             Bag state (context + localStorage)
    router.ts           Tiny two-page router
    motion.ts           GSAP / ScrollTrigger / Lenis helpers
    bubbles.ts          Canvas bubble particle system
    color.ts  util.ts   Colour mixing, seeded random, reduced-motion flag
vercel.json             SPA rewrite so /bag works on refresh
```

---

## Editing the products

All soap details live in **`src/data/soaps.ts`** — name, botanical name, tagline, description, benefits, price, unit, colours, bar shape (`bar` · `oval` · `pebble`) and texture (`speckle` · `flecks` · `strands` · `gel` · `none`). The soap illustrations, showcase, tray and receipt all update from this file.

---

## Accessibility

- All interactions have non-drag alternatives: a **Remove** link on the tray, a **tear** button under the receipt, and the wax seal works with **Space / Enter** held down.
- Dialogs use the native `<dialog>` element; form errors are announced and linked to their fields.
- Decorative graphics are hidden from screen readers; reduced-motion users get static versions of the animations.

---

## License

© 2026 Herbora Naturals. All rights reserved.
