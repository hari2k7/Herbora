import { useRef, useState } from 'react'
import type { Soap } from '../data/soaps'

interface Props {
  soap: Soap
  onAdd: (soap: Soap, from: HTMLElement) => void
}

/**
 * "Add to bag" — a lather-filled pill. Hover fills it with rising foam,
 * clicking pops a ring of bubbles and morphs the label into a drawn tick.
 */
export default function AddButton({ soap, onAdd }: Props) {
  const [added, setAdded] = useState(false)
  const timer = useRef<number>(0)
  const ref = useRef<HTMLButtonElement>(null)

  const click = () => {
    if (!ref.current) return
    onAdd(soap, ref.current)
    const r = ref.current.getBoundingClientRect()
    window.dispatchEvent(new CustomEvent('herbora:burst', { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }))
    setAdded(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setAdded(false), 1800)
  }

  return (
    <button ref={ref} className={'add-btn' + (added ? ' is-added' : '')} onClick={click} aria-label={`Add ${soap.name} soap to bag`}>
      <span className="add-foam" aria-hidden="true">
        <i /><i /><i /><i /><i />
      </span>
      <span className="add-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path className="add-plus" d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <path className="add-tick" d="M6 12.5l4 4 8-9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </span>
      <span className="add-text">
        <span className="add-t1">Add to bag</span>
        <span className="add-t2">Added!</span>
      </span>
    </button>
  )
}
