import { EventBus } from '@/game/EventBus'
import type { InteractableId } from '@/game/objects/registry'
import { useGameStore } from '@/store/useGameStore'

// Foco de teclado no menu de objetos → mesmo destaque do hover no quarto.
//
// Emite 'focus-highlight' (React → Phaser): a cena acende o contorno de hover do objeto `id`
// (null apaga) e responde com `object-hover(id, anchor)`, com `anchor` = topo do objeto em px CSS
// relativos ao canvas (como o `door-hover`), para a dica com o nome aparecer sobre ele.

let current: InteractableId | null = null

/** Foco (id) ou saída do foco (null) num item do menu de objetos. Só emite quando muda. */
export function highlightFromMenu(id: InteractableId | null) {
  useGameStore.getState().setMenuFocus(id)
  if (current === id) return
  current = id
  EventBus.emit('focus-highlight', id)
}
