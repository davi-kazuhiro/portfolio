import * as Phaser from 'phaser'
import type { InteractableId } from './objects/registry'
import type { Period } from './systems/period'

export interface ObjectAnchorPoint {
  id: InteractableId
  x: number
  y: number
}

// Contrato entre o canvas (Phaser) e a UI (React). Todo evento novo entra aqui.
export interface GameEvents {
  'scene-ready': [sceneKey: string]
  // Phaser → React (M6): o navegador não tem WebGL (ou o contexto falhou) e o jogo não foi criado.
  // Emitido uma vez, logo depois da montagem do <PhaserGame> (setTimeout 0), e nunca seguido de
  // 'scene-ready'. A UI troca o canvas por uma imagem estática e mostra o menu de objetos, que abre
  // os painéis sem a cena (requestOpen sem `sceneKey`).
  'renderer-unavailable': []
  // Phaser → React: objeto aceso (hover do ponteiro ou foco do menu) ou `null`. `anchor` = meio do
  // topo do objeto em px CSS relativos ao canvas (como o `door-hover`), para a dica ficar sobre ele;
  // reenviado quando a câmera ou o tamanho mudam com o objeto aceso.
  'object-hover': [id: InteractableId | null, anchor?: { x: number; y: number }]
  // Phaser → React (A4): meio do topo de cada interagível (px CSS do canvas), para as setas do
  // tutorial. Reenviado quando a câmera ou o tamanho mudam; `null` quando o quarto não está livre
  // (zoom de foco, painel aberto) ou a cena sai.
  'object-anchors': [anchors: ObjectAnchorPoint[] | null]
  // React → Phaser (A6): sobe o quarto `px` px CSS na tela (0 = volta), para o diálogo do
  // tutorial no celular não cobrir os objetos. Durante um foco fica guardado para a volta.
  'room-lift': [px: number]
  'object-open': [id: InteractableId]
  'panel-closed': []
  // React → Phaser: pede o zoom no objeto (menu de teclado); a cena responde com 'object-open'.
  'focus-object': [id: InteractableId]
  // React → Phaser: foco de teclado num item do menu de objetos (`null` = saiu do menu). A cena acende
  // o mesmo contorno do hover (o hover do ponteiro tem prioridade) e responde com 'object-hover'.
  'focus-highlight': [id: InteractableId | null]
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
