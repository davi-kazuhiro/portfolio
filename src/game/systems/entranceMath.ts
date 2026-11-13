// Regras puras da porta do quarto (cena Entrance). Spec: docs/arte/specs/2-porta.md.
// Sem Phaser: testáveis no Vitest.
import type { Period } from './period'

// Ilustração frontal desenhada a 1× (px da ilustração = px do mundo da cena).
export const ENTRANCE = {
  width: 320,
  height: 180,
  // Porta + batente + placa + luz sob a porta: nunca é cortada.
  safe: { x: 104, y: 0, width: 112, height: 180 },
  // Coluna repetida nas laterais em telas largas.
  column: 16,
  // Folha da porta (área de hover/clique): frame do `door` em (128, 22), folha 64×140.
  leaf: { x: 128, y: 22, width: 64, height: 140 },
  // Centro da maçaneta (folha x 52–57, y 72–77 → 128 + 55, 22 + 75).
  knob: { x: 183, y: 97 },
} as const

export interface EntranceView {
  // Zoom inteiro da câmera.
  zoom: number
  // true = tela estreita: escala pela zona segura e corta as laterais.
  narrow: boolean
  // Colunas `entrance-wall-column` necessárias de cada lado para encher a largura.
  sideColumns: number
}

// Escala inteira: `floor(min(vw/320, vh/180))`; em telas estreitas a zona segura (112 px de
// largura) manda, se der uma escala maior. Nunca menor que 1.
export function entranceView(viewW: number, viewH: number): EntranceView {
  const byH = viewH / ENTRANCE.height
  const wide = Math.floor(Math.min(viewW / ENTRANCE.width, byH))
  const narrowZoom = Math.floor(Math.min(viewW / ENTRANCE.safe.width, byH))
  const narrow = narrowZoom > wide
  const zoom = Math.max(1, narrow ? narrowZoom : wide)
  const extra = Math.max(0, viewW / zoom - ENTRANCE.width) / 2
  return { zoom, narrow, sideColumns: Math.ceil(extra / ENTRANCE.column) }
}

// Tag da folha: `closed`/`open` de dia, `-dusk`/`-night` nos outros períodos (pré-tingidas).
export function doorTag(state: 'closed' | 'open', period: Period): string {
  return period === 'day' ? state : `${state}-${period}`
}

// A tag pedida, se existir no sheet; senão a de dia (sheet sem `dusk`, spec "Variante de
// entardecer"); senão nenhuma (frame 0).
export function availableTag(tags: readonly string[], wanted: string, fallback: string): string | undefined {
  if (tags.includes(wanted)) return wanted
  return tags.includes(fallback) ? fallback : undefined
}

// Quem já entrou no quarto pula a porta. Em dev, `?entrance=1` força a porta (QA).
export const VISITED_KEY = 'quartoPixel.visited'

export function shouldSkipEntrance(visited: string | null, search: string, dev: boolean): boolean {
  if (dev && new URLSearchParams(search).get('entrance') === '1') return false
  return visited === '1'
}

// Acesso ao localStorage pode lançar (modo privado, storage bloqueado): nunca quebra a cena.
export function readVisited(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): string | null {
  try {
    return storage?.getItem(VISITED_KEY) ?? null
  } catch {
    return null
  }
}

export function markVisited(storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage) {
  try {
    storage?.setItem(VISITED_KEY, '1')
  } catch {
    // sem storage: a porta aparece de novo na próxima visita
  }
}

// Posição na tela (px CSS do canvas) de um ponto do mundo, dada a câmera.
export function worldToScreen(
  p: { x: number; y: number },
  view: { x: number; y: number },
  zoom: number,
): { x: number; y: number } {
  return { x: Math.round((p.x - view.x) * zoom), y: Math.round((p.y - view.y) * zoom) }
}

