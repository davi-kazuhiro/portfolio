import type { DoorAnchor } from '@/store/useGameStore'

export interface Box {
  left: number
  top: number
  width: number
  height: number
}

// A dica fica acima da maçaneta (`translate(-50%, -100%)` no CSS), com uma folga de GAP px.
export const HINT_GAP = 12
// Meia largura e altura reservadas para a dica não sair da tela ("Entrar"/"Enter" + borda).
export const HINT_HALF_WIDTH = 48
export const HINT_HEIGHT = 40
const EDGE = 8

const clamp = (v: number, min: number, max: number) => (max < min ? (min + max) / 2 : Math.min(max, Math.max(min, v)))

/**
 * Posição da dica "Entrar" em px CSS relativos ao contêiner do HUD (`.app`): a âncora vem
 * relativa ao canvas (`door-hover`), então soma o deslocamento do canvas dentro do contêiner.
 * O ponto devolvido é o meio da base da dica, preso dentro do contêiner. Inteiros (pixel art).
 */
export function hintPosition(anchor: DoorAnchor, canvas: Pick<Box, 'left' | 'top'>, container: Box): { left: number; top: number } {
  const x = anchor.x + canvas.left - container.left
  const y = anchor.y + canvas.top - container.top - HINT_GAP
  return {
    left: Math.round(clamp(x, HINT_HALF_WIDTH + EDGE, container.width - HINT_HALF_WIDTH - EDGE)),
    top: Math.round(clamp(y, HINT_HEIGHT + EDGE, container.height - EDGE)),
  }
}
