import * as Phaser from 'phaser'
import type { InteractableId } from './objects/registry'
import type { Period } from './systems/period'

// Contrato entre o canvas (Phaser) e a UI (React). Todo evento novo entra aqui.
export interface GameEvents {
  'scene-ready': [sceneKey: string]
  'object-hover': [id: InteractableId | null]
  'object-open': [id: InteractableId]
  'panel-closed': []
  // React → Phaser: pede o zoom no objeto (menu de teclado); a cena responde com 'object-open'.
  'focus-object': [id: InteractableId]
  // Phaser → React: período de luz do quarto (na criação e a cada reavaliação), para a visão de perto seguir o quarto.
  'period-changed': [period: Period]
  // React → Phaser: o visitante escolheu o período no HUD; a cena para de seguir o relógio e troca (com crossfade).
  'period-request': [period: Period]
}

const emitter = new Phaser.Events.EventEmitter()

export const EventBus = {
  emit<E extends keyof GameEvents>(event: E, ...args: GameEvents[E]) {
    emitter.emit(event, ...args)
  },
  on<E extends keyof GameEvents>(event: E, fn: (...args: GameEvents[E]) => void) {
    emitter.on(event, fn)
    return () => {
      emitter.off(event, fn)
    }
  },
}
