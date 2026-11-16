// Passos do tutorial em diálogo (A4). Lógica pura (testada em tests/tutorial.test.ts).

import type { TutorialFocus } from '@/store/useGameStore'

export interface TutorialStep {
  /** Chave em `tutorial.steps.*` do i18n. */
  key: string
  /** Setas amarelas sobre os interagíveis do quarto. */
  arrows?: boolean
  /** Botão do HUD destacado. */
  focus?: TutorialFocus
}

/** Passos na ordem; `touch` troca o texto de "passe o mouse / clique" por "toque / arraste". */
export function tutorialSteps(touch: boolean): TutorialStep[] {
  return [
    { key: 'welcome' },
    { key: touch ? 'objectsTouch' : 'objects', arrows: true },
    { key: 'closeup' },
    { key: 'menu', focus: 'menu' },
    { key: 'hud', focus: 'help' },
    { key: 'end' },
  ]
}

// Velocidade do texto letra a letra (ms por caractere).
export const TYPE_MS = 22

/** Quantos caracteres já aparecem depois de `elapsed` ms (inteiro, sem passar do total). */
export function typedLength(text: string, elapsed: number, msPerChar = TYPE_MS): number {
  if (msPerChar <= 0) return text.length
  return Math.min(text.length, Math.max(0, Math.floor(elapsed / msPerChar)))
}

// Celular (A6): abaixo desta largura o diálogo cobre boa parte do quarto, então o quarto sobe.
export const LIFT_MAX_WIDTH = 767
// Faixa dos botões do HUD no topo (px CSS) e folga acima do diálogo.
const HUD_BAND = 64
const LIFT_GAP = 8

/**
 * Quanto subir o quarto (px CSS) para o centro dele, hoje no meio do canvas, ir para o meio do
 * espaço livre entre a faixa do HUD e o topo do diálogo. 0 em telas largas ou se já cabe.
 */
export function roomLift(viewportWidth: number, canvasTop: number, canvasHeight: number, dialogTop: number): number {
  if (viewportWidth > LIFT_MAX_WIDTH) return 0
  const freeTop = canvasTop + HUD_BAND
  const freeBottom = dialogTop - LIFT_GAP
  if (freeBottom <= freeTop) return 0
  const roomCenter = canvasTop + canvasHeight / 2
  return Math.max(0, Math.round(roomCenter - (freeTop + freeBottom) / 2))
}
