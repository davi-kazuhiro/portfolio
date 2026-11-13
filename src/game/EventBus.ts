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
  // --- Porta do quarto (cena Entrance, M4) ---
  // Phaser → React: maçaneta em hover/foco; posição em px CSS relativos ao canvas para a dica
  // "Entrar" (DOM, i18n). `null` = sem hover.
  'door-hover': [anchor: { x: number; y: number } | null]
  // React → Phaser: o visitante pediu para entrar pelo DOM (botão "Entrar", Enter/Espaço).
  // A cena abre a porta (ou corta direto com reduced-motion) e inicia o Room.
  'entrance-enter': []
  // --- Áudio (ADR 0007) ---
  // React → Phaser: som ligado/desligado no HUD. O estado inicial a cena lê de `useGameStore.muted`.
  'audio-toggle': [on: boolean]
  // React → Phaser: SFX de interface disparado pelo DOM (botões do HUD).
  'ui-sfx': [name: 'toggle']
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
