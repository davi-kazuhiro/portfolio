import { useSyncExternalStore } from 'react'

// Com um diálogo aberto, o fundo (canvas, menu de objetos, dicas) fica `inert`. Os botões do HUD
// (idioma, período, som) continuam valendo dentro da visão de perto: o diálogo oferece um "slot"
// (`<HudSlot/>`) e o HUD é renderizado lá por portal, dentro do foco preso e da árvore acessível.

let slot: HTMLElement | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

export function registerHudSlot(el: HTMLElement) {
  if (slot === el) return
  slot = el
  notify()
}

/** Só esquece o slot se ainda for o mesmo (troca de diálogo: o novo pode registrar antes). */
export function unregisterHudSlot(el: HTMLElement) {
  if (slot !== el) return
  slot = null
  notify()
}

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
/** Slot atual (null = sem diálogo aberto). */
export const currentHudSlot = () => slot

/** Elemento onde o HUD deve ser renderizado (null = no lugar de sempre, sem diálogo). */
export function useHudSlot(): HTMLElement | null {
  return useSyncExternalStore(subscribe, currentHudSlot, () => null)
}
