import type { CSSProperties } from 'react'

interface Props {
  text: string
  className?: string
  /** class applied to each letter span */
  charClass?: string
  style?: CSSProperties
}

/**
 * Splits text into letters. Hovering a letter plays a squishy, soap-like
 * rubber-band wobble (class is removed when the animation finishes so it can replay).
 */
export default function WobbleText({ text, className, charClass = 'ch', style }: Props) {
  const play = (e: React.MouseEvent<HTMLSpanElement> | React.PointerEvent<HTMLSpanElement>) => {
    const el = e.currentTarget
    if (el.classList.contains('wobble')) return
    el.classList.add('wobble')
    el.addEventListener('animationend', () => el.classList.remove('wobble'), { once: true })
  }
  return (
    <span className={className} style={style} aria-label={text} role="text">
      {Array.from(text).map((c, i) =>
        c === ' ' ? (
          <span key={i} className="sp" aria-hidden="true">
            {' '}
          </span>
        ) : (
          <span key={i} className={charClass} aria-hidden="true" onPointerEnter={play} style={{ ['--i' as string]: i }}>
            {c}
          </span>
        ),
      )}
    </span>
  )
}
