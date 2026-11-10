// Atlas da visão de perto da prateleira (docs/arte/specs.md §4): PNG com frames recortados
// (trimmed) + JSON Hash do Aseprite. Cada frame traz a posição na ilustração 320×180 em
// `spriteSourceSize`; a composição vem de `meta.quartoPixel`. Tudo aqui é puro e testável.
import {
  isObj,
  num,
  parseAtlasBase,
  R,
  str,
  toDrawable,
  toSize,
  ZERO_RECT as ZERO,
  type AtlasFrame,
  type CueFlags,
  type Drawable,
  type SpriteAtlas,
} from './atlas'
import { unionRect, type CloseupGeometry, type Rect, type Sides } from './layout'
import { toRect, toSides } from './sheet'

export type { AtlasFrame, Drawable }

export type ShelfKind = 'book' | 'cartridge' | 'hobby' | 'decor'

export interface ShelfItem {
  id: string
  kind: ShelfKind
  rect: Rect
  day: string
  night: string
  hover: Drawable | null
  /** Área clicável (silhueta). `null` nos itens de decoração. */
  hit: Rect | null
  shadow: Drawable | null
}

export type HighlightLayout = 'book' | 'tools' | 'hobby'

export interface Highlight {
  layout: HighlightLayout
  shadow: Drawable | null
  parts: { part: string; rect: Rect; frame: string }[]
}

export interface ShelfArrow extends Drawable {
  hover: Drawable | null
}

export interface ShelfLayouts {
  book: {
    cover: Rect
    pages: [Rect, Rect]
    content: { left: Rect; right: Rect }
    pageTurn: { prev: Rect; next: Rect }
  }
  tools: {
    stage: Rect
    card: Rect
    content: Rect
    titleH: number
    ruleY: number
    firstRowY: number
    rowPitch: number
    rowIcon: { w: number; h: number }
    rowTextX: number
    maxRows: number
  }
  hobby: {
    stage: Rect
    arrows: { prev: ShelfArrow; next: ShelfArrow }
    cycle: string[]
  }
}

export interface ShelfAtlas extends SpriteAtlas {
  /** Tamanho da ilustração (320×180). */
  size: { w: number; h: number }
  crop: Rect
  minScale: number
  panelBackground: string
  defaultOpen: string
  background: Drawable
  /** Fundo com a sangria real em volta (`background.bleed`, ex.: `bleed/day` 480×308 em −80, −64). */
  backgroundBleed: Drawable | null
  /** Sangria real em volta da ilustração (`meta.quartoPixel.bleed`, px de arte). */
  bleed: Sides
  shelf: ShelfItem[]
  highlights: Record<string, Highlight>
  layouts: ShelfLayouts
  /** Nome do ícone (`java`, `git`...) → nome do frame. */
  icons: Record<string, string>
  iconSize: { w: number; h: number }
}

// Valores da spec (§4), usados quando o JSON não traz o campo.
export const SHELF_SPEC = {
  size: { w: 320, h: 180 },
  minScale: 3,
  panelBackground: '#f6f2ec',
  defaultOpen: 'languages',
  book: {
    cover: R(40, 76, 240, 94),
    pages: [R(46, 79, 114, 84), R(160, 79, 114, 84)] as [Rect, Rect],
    content: { left: R(52, 83, 102, 70), right: R(166, 83, 102, 70) },
    pageTurn: { prev: R(46, 153, 10, 10), next: R(264, 153, 10, 10) },
  },
  tools: {
    stage: R(28, 76, 82, 96),
    card: R(118, 76, 174, 98),
    content: R(126, 84, 158, 82),
    titleH: 13,
    ruleY: 13,
    firstRowY: 18,
    rowPitch: 12,
    rowIcon: { w: 8, h: 8 },
    rowTextX: 12,
    maxRows: 5,
  },
  hobby: {
    stage: R(100, 72, 120, 82),
    prev: R(60, 102, 18, 16),
    next: R(244, 102, 18, 16),
    cycle: ['rubiks-cube', 'origami', 'chess', 'table-tennis'],
  },
} as const

const KINDS: ShelfKind[] = ['book', 'cartridge', 'hobby', 'decor']
const LAYOUTS: HighlightLayout[] = ['book', 'tools', 'hobby']

function toItem(v: unknown): ShelfItem | null {
  if (!isObj(v) || typeof v.id !== 'string' || typeof v.day !== 'string') return null
  const kind = KINDS.includes(v.kind as ShelfKind) ? (v.kind as ShelfKind) : 'decor'
  const rect = toRect(v.rect, ZERO)
  return {
    id: v.id,
    kind,
    rect,
    day: v.day,
    night: str(v.night, v.day),
    hover: toDrawable(v.hover),
    // Decoração nunca é clicável; os demais usam `hit` ou, sem ele, o próprio `rect`.
    hit: kind === 'decor' ? null : v.hit ? toRect(v.hit, rect) : rect,
    shadow: toDrawable(v.shadow),
  }
}

function toHighlight(v: unknown): Highlight | null {
  if (!isObj(v)) return null
  const layout = LAYOUTS.includes(v.layout as HighlightLayout) ? (v.layout as HighlightLayout) : null
  if (!layout) return null
  const parts = (Array.isArray(v.parts) ? v.parts : [])
    .filter(isObj)
    .filter((p) => typeof p.frame === 'string')
    .map((p) => ({ part: str(p.part), rect: toRect(p.rect, ZERO), frame: p.frame as string }))
  return { layout, shadow: toDrawable(v.shadow), parts }
}

function toArrow(v: unknown, rect: Rect, name: 'prev' | 'next'): ShelfArrow {
  const d = toDrawable(v) ?? { rect, day: `arrow/${name}/day`, night: `arrow/${name}/night` }
  return { ...d, hover: isObj(v) ? toDrawable(v.hover) : null }
}

/**
 * Normaliza o JSON do atlas.
 * @param json conteúdo do `.json` (Aseprite Hash ou Array com `filename`)
 * @param jsonUrl caminho do `.json`, para resolver `meta.image`
 */
export function parseShelfAtlas(json: unknown, jsonUrl: string): ShelfAtlas {
  const { image, sheet, frames, qp } = parseAtlasBase(json, jsonUrl)

  const size = toSize(qp.size, SHELF_SPEC.size)
  const crops = isObj(qp.crops) ? qp.crops : {}

  const layouts = isObj(qp.layouts) ? qp.layouts : {}
  const book = isObj(layouts.book) ? layouts.book : {}
  const bookPages = Array.isArray(book.pages) ? book.pages : []
  const bookContent = isObj(book.content) ? book.content : {}
  const pageTurn = isObj(book.pageTurn) ? book.pageTurn : {}
  const tools = isObj(layouts.tools) ? layouts.tools : {}
  const title = isObj(tools.title) ? tools.title : {}
  const hobby = isObj(layouts.hobby) ? layouts.hobby : {}
  const arrows = isObj(hobby.arrows) ? hobby.arrows : {}
  const T = SHELF_SPEC.tools

  const highlights: Record<string, Highlight> = {}
  for (const [id, h] of Object.entries(isObj(qp.highlights) ? qp.highlights : {})) {
    const hl = toHighlight(h)
    if (hl) highlights[id] = hl
  }

  const iconsMeta = isObj(qp.icons) ? qp.icons : {}
  const icons: Record<string, string> = {}
  for (const [name, frame] of Object.entries(isObj(iconsMeta.frames) ? iconsMeta.frames : {})) {
    if (typeof frame === 'string') icons[name] = frame
  }
  // Ícones presentes no atlas mas fora de `icons.frames` também valem.
  for (const name of Object.keys(frames)) {
    if (name.startsWith('icon/') && !(name.slice(5) in icons)) icons[name.slice(5)] = name
  }

  const shelf = (Array.isArray(qp.shelf) ? qp.shelf : []).map(toItem).filter((i): i is ShelfItem => i !== null)
  const cycleRaw = Array.isArray(hobby.cycle) ? hobby.cycle.filter((c): c is string => typeof c === 'string') : []

  return {
    image,
    sheet,
    size,
    crop: toRect(crops.full, R(0, 0, size.w, size.h)),
    minScale: num(qp.minScale, SHELF_SPEC.minScale),
    panelBackground: str(qp.panelBackground, SHELF_SPEC.panelBackground),
    defaultOpen: str(qp.defaultOpen, SHELF_SPEC.defaultOpen),
    frames,
    background: toDrawable(qp.background) ?? { rect: R(0, 0, size.w, size.h), day: 'bg/day', night: 'bg/night' },
    backgroundBleed: isObj(qp.background) ? toDrawable(qp.background.bleed) : null,
    bleed: toSides(qp.bleed),
    shelf,
    highlights,
    layouts: {
      book: {
        cover: toRect(book.cover, SHELF_SPEC.book.cover),
        pages: [toRect(bookPages[0], SHELF_SPEC.book.pages[0]), toRect(bookPages[1], SHELF_SPEC.book.pages[1])],
        content: {
          left: toRect(bookContent.left, SHELF_SPEC.book.content.left),
          right: toRect(bookContent.right, SHELF_SPEC.book.content.right),
        },
        pageTurn: {
          prev: toRect(pageTurn.prev, SHELF_SPEC.book.pageTurn.prev),
          next: toRect(pageTurn.next, SHELF_SPEC.book.pageTurn.next),
        },
      },
      tools: {
        stage: toRect(tools.stage, T.stage),
        card: toRect(tools.card, T.card),
        content: toRect(tools.content, T.content),
        titleH: num(title.h, T.titleH),
        ruleY: num(title.ruleY, T.ruleY),
        firstRowY: num(tools.firstRowY, T.firstRowY),
        rowPitch: num(tools.rowPitch, T.rowPitch),
        rowIcon: toSize(tools.rowIcon, T.rowIcon),
        rowTextX: num(tools.rowTextX, T.rowTextX),
        maxRows: num(tools.maxRows, T.maxRows),
      },
      hobby: {
        stage: toRect(hobby.stage, SHELF_SPEC.hobby.stage),
        arrows: {
          prev: toArrow(arrows.prev, SHELF_SPEC.hobby.prev, 'prev'),
          next: toArrow(arrows.next, SHELF_SPEC.hobby.next, 'next'),
        },
        cycle: cycleRaw.length > 0 ? cycleRaw : [...SHELF_SPEC.hobby.cycle],
      },
    },
    icons,
    iconSize: toSize(iconsMeta.size, { w: 8, h: 8 }),
  }
}

// ---------- Composição ----------

export type LayerRole = 'background' | 'highlight-shadow' | 'shadow' | 'item' | 'part' | 'arrow'

export interface Layer extends CueFlags {
  key: string
  role: LayerRole
  frame: string
  /** Id do item da tábua (camadas `item` e `shadow`) ou da seta (`prev`/`next`). */
  ref?: string
  /** Item em hover/foco: sobe e fica acima dos vizinhos. */
  lifted?: boolean
  /** Objeto selecionado (ampliado no palco do hobby): flutua, subindo e descendo em px inteiros. */
  float?: boolean
}

export interface ComposeOptions {
  /** Item aberto (destaque); sai da tábua. */
  open: string | null
  night: boolean
  /** Itens e setas em hover/foco. */
  hot?: readonly string[]
}

/**
 * Ordem de composição da spec (§4): fundo → sombra do destaque → sombras da tábua (menos a do
 * aberto) → itens da tábua (menos o aberto) → partes do destaque → setas (só no layout hobby).
 * Frames ausentes do atlas são pulados.
 */
export function composeShelf(atlas: ShelfAtlas, { open, night, hot = [] }: ComposeOptions): Layer[] {
  const pick = (d: { day: string; night: string }) => (night ? d.night : d.day)
  const layers: Layer[] = []
  const push = (l: Layer) => {
    if (atlas.frames[l.frame]) layers.push(l)
  }
  const hl = open ? atlas.highlights[open] : undefined

  // Fundo com a sangria real quando existe (já contém `bg/*` no meio); senão, só a ilustração.
  const bgBleed = atlas.backgroundBleed && atlas.frames[pick(atlas.backgroundBleed)] ? atlas.backgroundBleed : null
  push({ key: 'bg', role: 'background', frame: pick(bgBleed ?? atlas.background) })
  if (hl?.shadow) push({ key: 'hl-shadow', role: 'highlight-shadow', frame: pick(hl.shadow) })
  for (const item of atlas.shelf) {
    if (item.id !== open && item.shadow) push({ key: `shadow:${item.id}`, role: 'shadow', ref: item.id, frame: pick(item.shadow) })
  }
  for (const item of atlas.shelf) {
    if (item.id === open) continue
    // Item clicável ganha o anel branco piscando (gerado em código, não o frame `hover` dourado);
    // o hover/foco o levanta e deixa o anel aceso. Os objetos da tábua ficam sempre iluminados:
    // de noite também usam o frame de dia (o fundo, as sombras e as setas seguem a noite).
    const clickable = item.hit !== null
    const isHot = clickable && hot.includes(item.id)
    push({
      key: `item:${item.id}`,
      role: 'item',
      ref: item.id,
      frame: item.day,
      lifted: isHot || undefined,
      cue: clickable || undefined,
      hot: isHot || undefined,
    })
  }
  // O objeto selecionado (hobby ampliado) flutua; a sombra dele fica parada no chão do palco.
  const float = hl?.layout === 'hobby' || undefined
  for (const p of hl?.parts ?? []) push({ key: `part:${p.part}`, role: 'part', frame: p.frame, float })
  if (hl?.layout === 'hobby') {
    for (const dir of ['prev', 'next'] as const) {
      const a = atlas.layouts.hobby.arrows[dir]
      const isHot = hot.includes(`arrow:${dir}`)
      push({ key: `arrow:${dir}`, role: 'arrow', ref: dir, frame: pick(a), cue: true, hot: isHot || undefined })
    }
  }
  return layers
}

/** Itens clicáveis da tábua, na ordem de desenho, sem o aberto. */
export function shelfButtons(atlas: ShelfAtlas, open: string | null): ShelfItem[] {
  return atlas.shelf.filter((i) => i.hit !== null && i.id !== open && atlas.highlights[i.id])
}

// ---------- Geometria da visão de perto (regra "cover", layout.ts) ----------

/**
 * De cada item clicável, os `HIT_KEEP` px de baixo (ou o item inteiro, se menor) precisam ficar
 * visíveis e fora da faixa do HUD: a 3× são 45 px CSS, acima do alvo de toque de 44 px. O resto
 * (o topo dos livros altos, já cortado na arte) pode passar por baixo do HUD ou da borda.
 */
export const HIT_KEEP = 15

/**
 * Sangria máxima por lado (px de arte). Maior que a do computador porque em cima e embaixo a
 * prateleira só tem parede listrada, que esticada na vertical continua igual (ex.: 1024×768 a 3×).
 */
export const SHELF_MAX_BLEED = 48

/**
 * Área que precisa ficar inteira visível: todos os destaques (livro aberto, cartucho + cartão,
 * palco + setas do hobby; todos, para a cena não pular ao trocar de item) e a parte de baixo de
 * cada item clicável da tábua.
 */
export function shelfContentRect(atlas: ShelfAtlas): Rect {
  const L = atlas.layouts
  const rects: Rect[] = [L.book.cover, L.tools.stage, L.tools.card, L.hobby.stage, L.hobby.arrows.prev.rect, L.hobby.arrows.next.rect]
  for (const hl of Object.values(atlas.highlights)) for (const p of hl.parts) rects.push(p.rect)
  for (const item of atlas.shelf) {
    if (!item.hit) continue
    const keep = Math.min(HIT_KEEP, item.hit.h)
    rects.push({ x: item.hit.x, y: item.hit.y + item.hit.h - keep, w: item.hit.w, h: keep })
  }
  return unionRect(...rects)
}

/** Geometria para `pickCloseupLayout`: a ilustração inteira, com `shelfContentRect` como conteúdo. */
export function shelfGeometry(atlas: ShelfAtlas): CloseupGeometry {
  return {
    size: atlas.size,
    contentRect: shelfContentRect(atlas),
    crops: { full: atlas.crop },
    minContent: { w: 0, h: 0 },
    minScale: atlas.minScale,
    bleed: atlas.bleed,
    maxBleed: SHELF_MAX_BLEED,
  }
}
