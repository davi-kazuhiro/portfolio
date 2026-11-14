import type { InteractableId } from '@/game/objects/registry'
import type { ObjectAnchor } from '@/store/useGameStore'

interface TooltipState {
  hoveredId: InteractableId | null
  hoverAnchor: ObjectAnchor | null
  menuFocusId: InteractableId | null
  openId: InteractableId | null
  sceneKey: string | null
}

export interface TooltipTarget {
  id: InteractableId
  anchor: ObjectAnchor | null
}

/**
 * Qual dica mostrar: o hover do ponteiro vence; senão o item do menu com foco de teclado (fora da
 * porta). Nada com um painel aberto. A âncora só vale para o objeto em hover (é a cena que a manda).
 */
export function tooltipTarget(s: TooltipState): TooltipTarget | null {
  if (s.openId) return null
  if (s.hoveredId) return { id: s.hoveredId, anchor: s.hoverAnchor }
  if (s.menuFocusId && s.sceneKey !== 'Entrance') return { id: s.menuFocusId, anchor: null }
  return null
}
