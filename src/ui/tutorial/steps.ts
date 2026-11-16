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
