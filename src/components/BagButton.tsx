import { forwardRef } from 'react'

interface Props {
  count: number
  bump: number
  onClick?: () => void
}

/** Floating bag pill pinned to the top-right corner. */
const BagButton = forwardRef<HTMLButtonElement, Props>(function BagButton({ count, bump, onClick }, ref) {
  return (
    <button ref={ref} key={bump} className={'bag-btn' + (bump ? ' bump' : '')} aria-label={`Open bag, ${count} items`} onClick={onClick}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M9 10V7a3 3 0 0 1 6 0v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="bag-label">Bag</span>
      <span className="bag-count">{count}</span>
    </button>
  )
})

export default BagButton
