import { useRef, type PointerEvent } from 'react'

// Swipe horizontal (toque ou caneta): arrastar para a esquerda avança (+1) e para a direita
// volta (−1), como virar página. O mouse usa os botões.
export function useSwipe(onSwipe: (dir: 1 | -1) => void, minPx = 40) {
  const start = useRef<{ x: number; y: number } | null>(null)
  return {
    onPointerDown: (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return
      start.current = { x: e.clientX, y: e.clientY }
    },
    onPointerUp: (e: PointerEvent) => {
      const s = start.current
      start.current = null
      if (!s) return
      const dx = e.clientX - s.x
      const dy = e.clientY - s.y
      if (Math.abs(dx) >= minPx && Math.abs(dx) > Math.abs(dy)) onSwipe(dx < 0 ? 1 : -1)
    },
    onPointerCancel: () => {
      start.current = null
    },
  }
}
