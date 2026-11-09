// Atlas da visão de perto do caderno (docs/arte/specs.md §5): `closeup-journal.{png,json}`.
// Frames recortados com a posição na ilustração em `spriteSourceSize`; composição, rects e
// cores em `meta.quartoPixel`. Tudo aqui é puro e testável.
import {
  isObj,
  num,
  obj,
  parseAtlasBase,
  R,
  str,
  toDrawable,
  toSize,
  type Drawable,
  type SpriteAtlas,
} from './atlas'
import { unionRect, type CloseupGeometry, type Rect, type Sides } from './layout'
import { toRect, toSides } from './sheet'

/** Estado de uma aba: experiências passadas à esquerda; a aberta e as seguintes à direita. */
export type TabState = 'left' | 'right-active' | 'right'
export const TAB_STATES: readonly TabState[] = ['right', 'right-active', 'left']

/** Frame posicionado na ilustração (no slot 0, para as abas). */
export interface Placed {
  rect: Rect
  frame: string
}

export interface TabArt extends Placed {
  hover: Placed | null
}

export interface TypeStyle {
  tab: string
  ink: string
}

export interface JournalAtlas extends SpriteAtlas {
  size: { w: number; h: number }
  crop: Rect
  minScale: number
  bleed: Sides
  panelBackground: string
  background: Drawable
  backgroundBleed: Drawable | null
  book: Placed & { cover: Rect; pages: [Rect, Rect] }
  content: { left: Rect; right: Rect }
  ruling: { y0: number; pitch: number; lineBoxTop: number; linesPerPage: number }
  stamp: { rect: Rect; frames: Record<string, Placed> }
  pageTurn: { prev: TabArt; next: TabArt }
  tabs: {
    slots: number
    pitch: number
    states: Record<TabState, { shadow: Placed | null; types: Record<string, TabArt> }>
    /** Área do nome (texto do DOM, uma linha, centrado) no slot 0 de cada estado. */
    label: Record<TabState, Rect>
    labelInk: string
  }
  checklist: { size: { w: number; h: number }; at: { x: number; y: number }; textX: number; empty: string; done: Record<string, string>; defaultDone: boolean }
  icons: { size: { w: number; h: number }; pin: Record<string, string>; calendar: Record<string, string> }
  types: Record<string, TypeStyle>
  textInk: { title: string; body: string }
}

// Valores da spec (§5), usados quando o JSON não traz o campo.
export const JOURNAL_SPEC = {
  size: { w: 320, h: 180 },
  minScale: 3,
  panelBackground: '#f6f2ec',
  book: R(27, 26, 262, 146),
  cover: R(27, 27, 262, 144),
  pages: [R(30, 27, 128, 141), R(158, 27, 128, 141)] as [Rect, Rect],
  content: { left: R(44, 34, 104, 124), right: R(170, 34, 104, 124) },
  ruling: { y0: 40, pitch: 7, lineBoxTop: 34, linesPerPage: 17 },
  stamp: R(116, 126, 30, 30),
  pageTurn: { prev: R(30, 158, 10, 10), next: R(276, 158, 10, 10) },
  tabs: {
    slots: 6,
    pitch: 22,
    label: { right: R(289, 40, 24, 11), 'right-active': R(289, 40, 27, 11), left: R(7, 40, 24, 11) } as Record<TabState, Rect>,
    labelInk: '#2f2c3a',
  },
  textInk: { title: '#2f2c3a', body: '#1f4a5c' },
} as const

function toPlaced(v: unknown, rect: Rect = R(0, 0, 0, 0)): Placed | null {
  if (!isObj(v) || typeof v.frame !== 'string') return null
  return { rect: toRect(v.rect, rect), frame: v.frame }
}

function toTabArt(v: unknown, rect?: Rect): TabArt | null {
  const p = toPlaced(v, rect)
  if (!p) return null
  return { ...p, hover: isObj(v) ? toPlaced(v.hover, p.rect) : null }
}

const strMap = (v: unknown): Record<string, string> => {
  const out: Record<string, string> = {}
  for (const [k, val] of Object.entries(obj(v))) if (typeof val === 'string') out[k] = val
  return out
}

/**
 * Normaliza o JSON do atlas do caderno.
 * @param json conteúdo do `.json` (Aseprite Hash ou Array com `filename`)
 * @param jsonUrl caminho do `.json`, para resolver `meta.image`
 */
export function parseJournalAtlas(json: unknown, jsonUrl: string): JournalAtlas {
  const { image, sheet, frames, qp } = parseAtlasBase(json, jsonUrl)
  const S = JOURNAL_SPEC
  const size = toSize(qp.size, S.size)
  const book = obj(qp.book)
  const pages = Array.isArray(book.pages) ? book.pages : []
  const content = obj(qp.content)
  const ruling = obj(qp.ruling)
  const stamp = obj(qp.stamp)
  const pageTurn = obj(qp.pageTurn)
  const tabs = obj(qp.tabs)
  const checklist = obj(qp.checklist)
  const icons = obj(qp.icons)
  const iconFrames = obj(icons.frames)
  const textInk = obj(qp.textInk)

  const stampFrames: Record<string, Placed> = {}
  for (const [type, v] of Object.entries(obj(stamp.frames))) {
    const p = toPlaced(v, toRect(stamp.rect, S.stamp))
    if (p) stampFrames[type] = p
  }

  const corner = (dir: 'prev' | 'next'): TabArt => {
    const v = obj(pageTurn[dir])
    const rect = toRect(v.rect, S.pageTurn[dir])
    const normal = str(v.normal, `page-turn/${dir}`)
    const hover = str(v.hover, `page-turn/${dir}/hover`)
    return { rect, frame: normal, hover: { rect, frame: hover } }
  }

  const statesRaw = obj(tabs.states)
  const states = {} as JournalAtlas['tabs']['states']
  for (const st of TAB_STATES) {
    const v = obj(statesRaw[st])
    const types: Record<string, TabArt> = {}
    for (const [type, t] of Object.entries(obj(v.types))) {
      const art = toTabArt(t)
      if (art) types[type] = art
    }
    states[st] = { shadow: toPlaced(v.shadow), types }
  }

  const types: Record<string, TypeStyle> = {}
  for (const [type, v] of Object.entries(obj(qp.types))) {
    const o = obj(v)
    types[type] = { tab: str(o.tab, '#c8b89c'), ink: str(o.ink, S.textInk.body) }
  }

  const at = Array.isArray(checklist.at) ? checklist.at : []

  return {
    image,
    sheet,
    frames,
    size,
    crop: toRect(obj(qp.crops).full, R(0, 0, size.w, size.h)),
    minScale: num(qp.minScale, S.minScale),
    bleed: toSides(qp.bleed),
    panelBackground: str(qp.panelBackground, S.panelBackground),
    background: toDrawable(qp.background) ?? { rect: R(0, 0, size.w, size.h), day: 'bg/day', night: 'bg/night' },
    backgroundBleed: isObj(qp.background) ? toDrawable(qp.background.bleed) : null,
    book: {
      rect: toRect(book.rect, S.book),
      frame: str(book.frame, 'book'),
      cover: toRect(book.cover, S.cover),
      pages: [toRect(pages[0], S.pages[0]), toRect(pages[1], S.pages[1])],
    },
    content: { left: toRect(content.left, S.content.left), right: toRect(content.right, S.content.right) },
    ruling: {
      y0: num(ruling.y0, S.ruling.y0),
      pitch: num(ruling.pitch, S.ruling.pitch),
      lineBoxTop: num(ruling.lineBoxTop, S.ruling.lineBoxTop),
      linesPerPage: num(ruling.linesPerPage, S.ruling.linesPerPage),
    },
    stamp: { rect: toRect(stamp.rect, S.stamp), frames: stampFrames },
    pageTurn: { prev: corner('prev'), next: corner('next') },
    tabs: {
      slots: num(tabs.slots, S.tabs.slots),
      pitch: num(tabs.pitch, S.tabs.pitch),
      states,
      label: Object.fromEntries(TAB_STATES.map((st) => [st, toRect(obj(tabs.label)[st], S.tabs.label[st])])) as Record<TabState, Rect>,
      labelInk: str(tabs.labelInk, S.tabs.labelInk),
    },
    checklist: {
      size: toSize(checklist.size, { w: 9, h: 8 }),
      at: { x: num(at[0], 0), y: num(at[1], -2) },
      textX: num(checklist.textX, 10),
      empty: str(checklist.empty, 'check/empty'),
      done: strMap(checklist.done),
      defaultDone: checklist.defaultDone !== false,
    },
    icons: { size: toSize(icons.size, { w: 7, h: 7 }), pin: strMap(iconFrames.pin), calendar: strMap(iconFrames.calendar) },
    types,
    textInk: { title: str(textInk.title, S.textInk.title), body: str(textInk.body, S.textInk.body) },
  }
}

// ---------- Abas ----------

/** Estado da aba `j` com a experiência `open` aberta (specs.md §5). */
export function tabState(j: number, open: number): TabState {
  if (j < open) return 'left'
  return j === open ? 'right-active' : 'right'
}

/** Deslocamento vertical (px de arte) do slot `j`: rects e frames do JSON estão no slot 0. */
export const slotOffset = (atlas: JournalAtlas, j: number) => atlas.tabs.pitch * j

/** Arte da aba `j` (rect já deslocado para o slot), ou `null` se o tipo não tem aba no atlas. */
export function tabArt(atlas: JournalAtlas, j: number, open: number, type: string): TabArt | null {
  const art = atlas.tabs.states[tabState(j, open)].types[type]
  if (!art) return null
  const dy = slotOffset(atlas, j)
  const shift = (p: Placed): Placed => ({ ...p, rect: { ...p.rect, y: p.rect.y + dy } })
  return { ...shift(art), hover: art.hover ? shift(art.hover) : null }
}

/** Área do nome da aba `j` (rect já deslocado para o slot). */
export function tabLabelRect(atlas: JournalAtlas, j: number, open: number): Rect {
  const r = atlas.tabs.label[tabState(j, open)]
  return { ...r, y: r.y + slotOffset(atlas, j) }
}

// ---------- Composição ----------

export type JournalLayerRole = 'background' | 'tab-shadow' | 'book' | 'tab' | 'stamp' | 'corner'

export interface JournalLayer {
  key: string
  role: JournalLayerRole
  frame: string
  /** Deslocamento vertical (px de arte) do slot da aba; os demais, 0. */
  dy: number
}

export interface JournalComposeOptions {
  /** Tipos das experiências, na ordem de exibição. */
  types: readonly string[]
  /** Índice da experiência aberta (página dupla). */
  open: number
  night: boolean
  /** Aba (índice) em hover/foco. */
  hotTab?: number | null
  /** Canto em hover/foco (só se puder virar). */
  hotCorner?: 'prev' | 'next' | null
}

/**
 * Ordem de composição da spec (§5): fundo (com a sangria real) → sombras das abas → caderno →
 * abas (ou o hover) → carimbo do tipo da aberta → canto em hover. Abas além de `slots` não são
 * desenhadas. Frames ausentes do atlas são pulados. Só o fundo muda à noite.
 */
export function composeJournal(atlas: JournalAtlas, { types, open, night, hotTab = null, hotCorner = null }: JournalComposeOptions): JournalLayer[] {
  const layers: JournalLayer[] = []
  const push = (l: JournalLayer) => {
    if (atlas.frames[l.frame]) layers.push(l)
  }
  const pick = (d: Drawable) => (night ? d.night : d.day)
  const bgBleed = atlas.backgroundBleed && atlas.frames[pick(atlas.backgroundBleed)] ? atlas.backgroundBleed : null
  push({ key: 'bg', role: 'background', frame: pick(bgBleed ?? atlas.background), dy: 0 })

  const n = Math.min(types.length, atlas.tabs.slots)
  for (let j = 0; j < n; j++) {
    const shadow = atlas.tabs.states[tabState(j, open)].shadow
    if (shadow) push({ key: `tab-shadow:${j}`, role: 'tab-shadow', frame: shadow.frame, dy: slotOffset(atlas, j) })
  }
  push({ key: 'book', role: 'book', frame: atlas.book.frame, dy: 0 })
  for (let j = 0; j < n; j++) {
    const art = atlas.tabs.states[tabState(j, open)].types[types[j]]
    if (!art) continue
    const frame = hotTab === j && art.hover ? art.hover.frame : art.frame
    push({ key: `tab:${j}`, role: 'tab', frame, dy: slotOffset(atlas, j) })
  }
  const stamp = types[open] !== undefined ? atlas.stamp.frames[types[open]] : undefined
  if (stamp) push({ key: 'stamp', role: 'stamp', frame: stamp.frame, dy: 0 })
  if (hotCorner) {
    const c = atlas.pageTurn[hotCorner]
    if (c.hover) push({ key: `corner:${hotCorner}`, role: 'corner', frame: c.hover.frame, dy: 0 })
  }
  return layers
}

// ---------- Geometria da visão de perto (regra "cover", layout.ts) ----------

/** Sangria sintética máxima (px de arte): igual à da prateleira (tampo e parede esticados). */
export const JOURNAL_MAX_BLEED = 48

/**
 * Área que precisa ficar inteira visível: o caderno e todos os slots de aba dos dois lados
 * (com o hover, 1 px maior), para a cena não pular ao virar a página.
 */
export function journalContentRect(atlas: JournalAtlas): Rect {
  const rects: Rect[] = [atlas.book.rect]
  const last = slotOffset(atlas, Math.max(0, atlas.tabs.slots - 1))
  for (const st of TAB_STATES) {
    for (const art of Object.values(atlas.tabs.states[st].types)) {
      for (const p of [art, art.hover]) {
        if (!p) continue
        rects.push(p.rect, { ...p.rect, y: p.rect.y + last })
      }
    }
  }
  return unionRect(...rects)
}

/** Geometria para `pickCloseupLayout`. */
export function journalGeometry(atlas: JournalAtlas): CloseupGeometry {
  return {
    size: atlas.size,
    contentRect: journalContentRect(atlas),
    crops: { full: atlas.crop },
    minContent: { w: 0, h: 0 },
    minScale: atlas.minScale,
    bleed: atlas.bleed,
    maxBleed: JOURNAL_MAX_BLEED,
  }
}
