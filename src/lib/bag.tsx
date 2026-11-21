import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { soaps, type Soap } from '../data/soaps'

/**
 * Bag state shared by the landing page and the bag page.
 * Saved in the browser (localStorage), so a refresh or a later visit keeps the items.
 */

type Items = Record<string, number>

interface BagValue {
  items: Items
  count: number
  subtotal: number
  lines: { soap: Soap; qty: number; total: number }[]
  add: (id: string, n?: number) => void
  setQty: (id: string, qty: number) => void
  remove: (id: string) => void
  clear: () => void
}

const KEY = 'herbora-bag-v1'
const MAX_QTY = 20

function load(): Items {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Items
    const valid: Items = {}
    for (const s of soaps) {
      const q = Math.floor(Number(parsed[s.id]))
      if (q > 0) valid[s.id] = Math.min(q, MAX_QTY)
    }
    return valid
  } catch {
    return {}
  }
}

const BagContext = createContext<BagValue | null>(null)

export function BagProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Items>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      /* private mode or storage full: the bag still works for this visit */
    }
  }, [items])

  // keep several open tabs in sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setItems(load()) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setQty = useCallback((id: string, qty: number) => {
    setItems((b) => {
      const next = { ...b }
      const q = Math.max(0, Math.min(MAX_QTY, Math.floor(qty)))
      if (q === 0) delete next[id]
      else next[id] = q
      return next
    })
  }, [])
  const add = useCallback((id: string, n = 1) => setItems((b) => ({ ...b, [id]: Math.min(MAX_QTY, (b[id] ?? 0) + n) })), [])
  const remove = useCallback((id: string) => setQty(id, 0), [setQty])
  const clear = useCallback(() => setItems({}), [])

  const value = useMemo<BagValue>(() => {
    const lines = soaps.filter((s) => items[s.id]).map((soap) => ({ soap, qty: items[soap.id], total: items[soap.id] * soap.price }))
    return {
      items,
      lines,
      count: lines.reduce((a, l) => a + l.qty, 0),
      subtotal: lines.reduce((a, l) => a + l.total, 0),
      add,
      setQty,
      remove,
      clear,
    }
  }, [items, add, setQty, remove, clear])

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>
}

export function useBag() {
  const ctx = useContext(BagContext)
  if (!ctx) throw new Error('useBag must be used inside <BagProvider>')
  return ctx
}

export const MAX_BAG_QTY = MAX_QTY
