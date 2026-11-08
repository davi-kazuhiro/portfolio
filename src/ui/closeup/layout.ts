// Escala e recorte da visão de perto (ADR 0006, regra "cover" de 2026-11-08). Função pura:
// recebe o tamanho útil da janela e os números do JSON da ilustração.
//
// A arte (ilustração + sangria real exportada em volta, `meta.quartoPixel.bleed`) cobre a janela
// inteira em escala inteira: o excesso é cortado nas bordas e o recorte centraliza a ilustração o
// máximo possível, com a área de conteúdo inteira visível e abaixo da faixa do HUD. O que nem a
// sangria real alcançar é preenchido esticando a borda da arte (`bleed.ts`). Sem escala possível
// (celular), modo `fallback`: o painel em tela cheia.

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Sides {
  top: number
  right: number
  bottom: number
  left: number
}

export type CloseupMode = 'cover' | 'fallback'

export interface CloseupGeometry {
  /** Tamanho da ilustração a 1×. */
  size: { w: number; h: number }
  /** Área que precisa ficar inteira visível e fora da faixa do HUD, em px da ilustração. */
  contentRect: Rect
  /** `full` = região da ilustração desenhada. (`monitor` é do modo B antigo e não é mais usado.) */
  crops: { full: Rect; monitor?: Rect }
  /** Tamanho mínimo da área de conteúdo (px CSS) e escala mínima. */
  minContent?: { w: number; h: number }
  minScale?: number
  /**
   * Sangria real: px de arte desenhada em volta de `crops.full` (`meta.quartoPixel.bleed`). A arte
   * disponível vira `crops.full` expandido por ela; a sangria sintética só cobre o que passar disso.
   */
  bleed?: Sides
  /** Sangria sintética máxima por lado, em px de arte, a partir da borda da arte real (acima disso, `fallback`). */
  maxBleed?: number
}

export interface CloseupLayout {
  mode: CloseupMode
  /** Escala inteira (0 no modo `fallback`, que não mostra a ilustração). */
  scale: number
  /** Região da arte desenhada, em px da ilustração: `crops.full` + sangria real (vazia no `fallback`). */
  crop: Rect
  /** Onde fica essa região na tela (px CSS); pode passar das bordas da janela (o excesso é cortado). */
  view: Rect
  /** Onde fica a área de conteúdo na tela (px CSS). `fallback`: a janela inteira. */
  content: Rect
  /** Faixas da janela que nem a arte nem a sangria real cobrem (px CSS): sangria sintética, esticando a borda. */
  bleed: Sides
}

// Padrões da spec quando o JSON não traz `minContentCss` / `minScale`.
const MIN_CONTENT = { w: 640, h: 360 }
const MIN_SCALE = 3
/** Sangria vertical (px de arte) que conta como cobertura: alguns px a mais de parede ou mesa. */
export const FREE_BLEED = 8
/** Sangria máxima por lado (px de arte), quando a geometria não define `maxBleed`. */
export const MAX_BLEED = 32

const ZERO: Rect = { x: 0, y: 0, w: 0, h: 0 }
const NO_BLEED: Sides = { top: 0, right: 0, bottom: 0, left: 0 }

/** Altura (px CSS) da faixa do HUD no topo: o conteúdo não entra nela (botões de idioma/som). */
export const HUD_BAND = 64

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Posição (px CSS) da arte disponível num eixo. Parte da ilustração (`ilStart`, `ilLen` dentro da
 * arte) centralizada; se a arte é maior que a janela, presa para cobrir; depois, presa para o
 * conteúdo (`cStart`–`cEnd` dentro da arte) caber em `[lo, view]`.
 */
function place(view: number, art: number, ilStart: number, ilLen: number, cStart: number, cEnd: number, lo: number): number {
  let p = Math.floor((view - ilLen) / 2) - ilStart
  if (art >= view) p = clamp(p, view - art, 0)
  return clamp(p, lo - cStart, view - cEnd)
}


/** `r` expandido por `b` de cada lado. */
export function expandRect(r: Rect, b: Sides): Rect {
  return { x: r.x - b.left, y: r.y - b.top, w: r.w + b.left + b.right, h: r.h + b.top + b.bottom }
}

function fit(vw: number, vh: number, geo: CloseupGeometry, s: number, reserveTop: number): CloseupLayout | null {
  const il = geo.crops.full
  const real = geo.bleed ?? NO_BLEED
  const crop = expandRect(il, real)
  const c = geo.contentRect
  const cw = c.w * s
  const ch = c.h * s
  const min = geo.minContent ?? MIN_CONTENT
  if (cw < min.w || ch < min.h || cw > vw || ch > vh - reserveTop) return null
  const w = crop.w * s
  const h = crop.h * s
  const cx = (c.x - crop.x) * s
  const cy = (c.y - crop.y) * s
  const x = place(vw, w, real.left * s, il.w * s, cx, cx + cw, 0)
  const y = place(vh, h, real.top * s, il.h * s, cy, cy + ch, reserveTop)
  const bleed = { top: Math.max(0, y), left: Math.max(0, x), bottom: Math.max(0, vh - (y + h)), right: Math.max(0, vw - (x + w)) }
  const max = (geo.maxBleed ?? MAX_BLEED) * s
  if (Object.values(bleed).some((b) => b > max)) return null
  return { mode: 'cover', scale: s, crop, view: { x, y, w, h }, content: { x: x + cx, y: y + cy, w: cw, h: ch }, bleed }
}

/**
 * Custo de uma escala: cobrir só com arte (sem sangria sintética) vem primeiro; depois a sangria
 * sintética lateral, a vertical além da folga e, no empate, a menor escala (mais contexto).
 */
function cost(l: CloseupLayout): [number, number, number, number] {
  const b = l.bleed
  const free = FREE_BLEED * l.scale
  const any = b.left + b.right + b.top + b.bottom > 0 ? 1 : 0
  return [any, b.left + b.right, Math.max(0, b.top + b.bottom - free), l.scale]
}

const less = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i]
  return false
}

/**
 * Escala inteira e posição da arte cobrindo `vw × vh`, com a ilustração o mais centralizada
 * possível. Entre as escalas em que o conteúdo cabe (abaixo de `reserveTop`) e a sangria sintética
 * fica ≤ `maxBleed` por lado: a **menor escala que cobre só com arte** (ilustração + sangria real);
 * se nenhuma cobre, a de menor sangria sintética lateral, depois vertical (até `FREE_BLEED` px de
 * arte não conta), e a menor escala. Nenhuma → `fallback`.
 */
export function pickCloseupLayout(vw: number, vh: number, geo: CloseupGeometry, reserveTop = 0): CloseupLayout {
  const first = Math.max(1, geo.minScale ?? MIN_SCALE)
  const last = Math.floor(Math.min(vw / geo.contentRect.w, (vh - reserveTop) / geo.contentRect.h))
  let best: CloseupLayout | null = null
  for (let s = first; s <= last; s++) {
    const l = fit(vw, vh, geo, s, reserveTop)
    if (l && (!best || less(cost(l), cost(best)))) best = l
  }
  return (
    best ?? {
      mode: 'fallback',
      scale: 0,
      crop: ZERO,
      view: ZERO,
      content: { x: 0, y: 0, w: vw, h: vh },
      bleed: NO_BLEED,
    }
  )
}

/** Bounding box de vários retângulos. */
export function unionRect(...rs: Rect[]): Rect {
  const x = Math.min(...rs.map((r) => r.x))
  const y = Math.min(...rs.map((r) => r.y))
  const x2 = Math.max(...rs.map((r) => r.x + r.w))
  const y2 = Math.max(...rs.map((r) => r.y + r.h))
  return { x, y, w: x2 - x, h: y2 - y }
}

/**
 * Tamanho da fonte do painel dentro da tela (px CSS), em degraus pela escala da arte:
 * 1 px da ilustração = `scale` px CSS, e a fonte acompanha (4 px de arte por letra), sem
 * descer de 14 px (o menor texto do painel, a 0,85em, fica ≥ 12 px).
 */
export function screenFontSize(layout: CloseupLayout): number {
  return layout.mode === 'fallback' ? 16 : Math.max(14, layout.scale * 4)
}
