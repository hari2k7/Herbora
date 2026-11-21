/** Empty bag: a bare soap dish with one lonely bubble drifting up. */
export default function EmptyBag({ onShop }: { onShop: () => void }) {
  return (
    <section className="empty-bag" aria-labelledby="empty-title">
      <div className="empty-scene" aria-hidden="true">
        <span className="lonely-bubble" />
        <svg viewBox="0 0 320 150" className="empty-dish">
          <defs>
            <linearGradient id="dishTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#e8e2d3" />
            </linearGradient>
            <linearGradient id="dishSide" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d9d1bf" />
              <stop offset="1" stopColor="#b9b09c" />
            </linearGradient>
            <radialGradient id="dishShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#3a3a2a" stopOpacity="0.28" />
              <stop offset="1" stopColor="#3a3a2a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="160" cy="128" rx="150" ry="18" fill="url(#dishShadow)" />
          <path d="M22 70 C22 112 86 124 160 124 C234 124 298 112 298 70 Z" fill="url(#dishSide)" />
          <ellipse cx="160" cy="70" rx="138" ry="40" fill="url(#dishTop)" />
          <ellipse cx="160" cy="72" rx="112" ry="28" fill="#efeadf" />
          {[-80, -48, -16, 16, 48, 80].map((x) => (
            <rect key={x} x={160 + x - 9} y={58} width={18} height={30} rx={9} fill="#e2dccd" />
          ))}
          <ellipse cx="110" cy="52" rx="60" ry="9" fill="#fff" opacity="0.7" />
        </svg>
      </div>
      <h2 id="empty-title">Your bag is empty</h2>
      <p>Nine hand-pressed bars are waiting for you.</p>
      <button type="button" className="bag-cta" onClick={onShop}>
        Meet the bars
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </section>
  )
}
