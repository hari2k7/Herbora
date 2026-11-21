import Pond from './Pond'
import WobbleText from './WobbleText'

export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-media">
        <Pond />
      </div>

      <div className="hero-copy">
        <h1 className="hero-title">
          <WobbleText text="HERBORA" />
        </h1>
        <p className="hero-tag">
          Herbal soaps, hand-pressed from <em>Indian gardens.</em>
        </p>
        <div className="hero-cta">
          <a href="#soaps" className="btn-leaf" onClick={(e) => { e.preventDefault(); import('../lib/motion').then((m) => m.scrollToTarget('#soaps')) }}>
            <span className="btn-leaf-bg" aria-hidden="true" />
            <span className="btn-leaf-label">Meet the nine bars</span>
            <span className="btn-leaf-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </a>
        </div>
      </div>

      <div className="scroll-cue" aria-hidden="true">
        <span className="cue-bubble" />
        <span>Scroll to lather</span>
      </div>
    </section>
  )
}
