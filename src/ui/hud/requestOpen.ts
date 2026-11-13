import { EventBus } from '@/game/EventBus'
import type { InteractableId } from '@/game/objects/registry'
import { useGameStore } from '@/store/useGameStore'

// Tempo máximo esperando a cena responder 'focus-object' com 'object-open'
// (o zoom dura ≈400 ms). Passou disso, ou a cena não está pronta, abre direto
// para o teclado nunca ficar sem resposta.
const FALLBACK_MS = 1500
// Na porta (cena Entrance), 'focus-object' troca de cena antes do zoom (carrega o quarto,
// sem a animação da porta): o prazo é maior, para o painel não abrir sozinho no meio da troca.
const ENTRANCE_FALLBACK_MS = 6000

/** Prazo do fallback conforme a cena em que o pedido foi feito. */
export function fallbackDelay(sceneKey: string | null): number {
  return sceneKey === 'Entrance' ? ENTRANCE_FALLBACK_MS : FALLBACK_MS
}

let pending: ReturnType<typeof setTimeout> | null = null

/** Pede à cena o zoom no objeto (mesmo fluxo do clique); a cena responde com 'object-open'. */
export function requestOpen(id: InteractableId) {
  const { sceneKey, open } = useGameStore.getState()
  if (!sceneKey) {
    open(id)
    return
  }
  cancelPendingOpen()
  pending = setTimeout(() => {
    pending = null
    if (useGameStore.getState().openId !== id) open(id)
  }, fallbackDelay(sceneKey))
  EventBus.emit('focus-object', id)
}

/** Chamado quando 'object-open' chega: a cena respondeu, o fallback não é mais necessário. */
export function cancelPendingOpen() {
  if (pending) clearTimeout(pending)
  pending = null
}

/** Há uma abertura pelo teclado esperando a cena (zoom de entrada em curso). */
export function hasPendingOpen() {
  return pending !== null
}

/**
 * Esc durante o zoom de entrada: a cena cancela o zoom (volta ao quarto sem 'object-open');
 * aqui o fallback também é cancelado, para o painel não abrir sozinho depois. Devolve `true`
 * se havia uma abertura pendente.
 */
export function cancelPendingOnEscape(key: string): boolean {
  if (key !== 'Escape' || pending === null) return false
  cancelPendingOpen()
  return true
}
