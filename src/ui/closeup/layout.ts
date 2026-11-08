// Escolha do modo e da escala da visão de perto (docs/arte/specs.md §3, "Recorte em telas
// estreitas"). Função pura: recebe o tamanho útil da janela e os números do JSON da ilustração.

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export type CloseupMode = 'A' | 'B' | 'C'

export interface CloseupGeometry {
  /** Tamanho da ilustração a 1×. */
  size: { w: number; h: number }
  /** Área de conteúdo (tela do monitor), em px da ilustração. */
  contentRect: Rect
  /** Recortes: `full` (modo A) e `monitor` (modo B). */
  crops: { full: Rect; monitor: Rect }
  /** Tamanho mínimo da área de conteúdo (px CSS) e escala mínima nos modos A e B. */
  minContent?: { w: number; h: number }
  minScale?: number
}

export interface CloseupLayout {
  mode: CloseupMode
  /** Escala inteira (0 no modo C, que não mostra a ilustração). */
  scale: number
  /** Recorte da ilustração mostrado (vazio no modo C). */
  crop: Rect
  /** Onde fica o recorte na tela (px CSS). */
  view: Rect
  /** Onde fica a área de conteúdo na tela (px CSS). Modo C: calculado pelo CSS. */
  content: Rect
}

// Padrões da spec quando o JSON não traz `minContentCss` / `minScale`.
const MIN_CONTENT = { w: 640, h: 360 }
const MIN_SCALE = 3

const ZERO: Rect = { x: 0, y: 0, w: 0, h: 0 }

function fit(vw: number, vh: number, geo: CloseupGeometry, crop: Rect, reserveTop: number): CloseupLayout | null {
  const scale = Math.floor(Math.min(vw / crop.w, (vh - reserveTop) / crop.h))
  const cw = geo.contentRect.w * scale
  const ch = geo.contentRect.h * scale
  const min = geo.minContent ?? MIN_CONTENT
  if (scale < (geo.minScale ?? MIN_SCALE) || cw < min.w || ch < min.h) return null
  const w = crop.w * scale
  const h = crop.h * scale
  // Centralizado e alinhado ao pixel CSS inteiro; nunca acima da faixa reservada (HUD).
  const x = Math.floor((vw - w) / 2)
  const y = Math.max(reserveTop, Math.floor((vh - h) / 2))
  return {
    mode: crop === geo.crops.full ? 'A' : 'B',
    scale,
    crop,
    view: { x, y, w, h },
    content: {
      x: x + (geo.contentRect.x - crop.x) * scale,
      y: y + (geo.contentRect.y - crop.y) * scale,
      w: cw,
      h: ch,
    },
  }
}

/** Altura (px CSS) da faixa do HUD no topo: a ilustração não entra nela (botões de idioma/som). */
export const HUD_BAND = 64

/**
 * Primeiro modo (A → B → C) em que a área de conteúdo fica com pelo menos 640×360.
 * `reserveTop` deixa uma faixa livre no topo (o HUD fica por cima da visão de perto).
 */
export function pickCloseupLayout(vw: number, vh: number, geo: CloseupGeometry, reserveTop = 0): CloseupLayout {
  return (
    fit(vw, vh, geo, geo.crops.full, reserveTop) ??
    fit(vw, vh, geo, geo.crops.monitor, reserveTop) ?? {
      mode: 'C',
      scale: 0,
      crop: ZERO,
      view: ZERO,
      content: { x: 0, y: 0, w: vw, h: vh },
    }
  )
}

/**
 * Tamanho da fonte do painel dentro da tela (px CSS), em degraus pela escala da arte:
 * 1 px da ilustração = `scale` px CSS, e a fonte acompanha (4 px de arte por letra), sem
 * descer de 14 px (o menor texto do painel, a 0,85em, fica ≥ 12 px).
 */
export function screenFontSize(layout: CloseupLayout): number {
  return layout.mode === 'C' ? 16 : Math.max(14, layout.scale * 4)
}
