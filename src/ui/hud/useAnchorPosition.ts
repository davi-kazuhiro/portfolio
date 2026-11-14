import { useLayoutEffect, useState, type RefObject } from 'react'
import { hintPosition } from './hintPosition'

/**
 * Posição (left/top no contêiner do HUD) de uma dica presa a um ponto do canvas (`door-hover`,
 * `object-hover` com âncora). Mede a largura da dica para ela não sair da tela. `dep` refaz a conta
 * quando o texto muda.
 */
export function useAnchorPosition(anchor: { x: number; y: number } | null, ref: RefObject<HTMLElement | null>, dep?: unknown) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  useLayoutEffect(() => {
    const el = ref.current
    const container = el?.offsetParent
    const canvas = document.querySelector('.game-canvas canvas') ?? document.querySelector('.game-canvas')
    if (!anchor || !el || !container || !canvas) {
      setPos(null)
      return
    }
    const c = container.getBoundingClientRect()
    const k = canvas.getBoundingClientRect()
    const box = { left: c.left, top: c.top, width: c.width, height: c.height }
    setPos(hintPosition(anchor, k, box, Math.ceil(el.offsetWidth / 2)))
  }, [anchor, ref, dep])
  return pos
}
