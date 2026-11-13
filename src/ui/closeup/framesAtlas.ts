// Atlas da visão de perto dos quadros (docs/arte/specs/7-quadros.md, variação A "galeria de
// molduras"): `closeup-frames.{png,json}`. Frames recortados com a posição na ilustração em
// `spriteSourceSize`; composição, rects e cores em `meta.quartoPixel`. Tudo aqui é puro e testável.
import { isObj, num, obj, parseAtlasBase, pickPeriod, R, str, toDrawable, toSize, type CueFlags, type Drawable, type SpriteAtlas } from './atlas'
import { unionRect, type CloseupGeometry, type Rect, type Sides } from './layout'
import { toRect, toSides } from './sheet'

/** Frame posicionado na ilustração (na vaga 0, para as miniaturas). */
export interface Placed {
  rect: Rect
  frame: string
}

export interface PlacedHover extends Placed {
  hover: Placed | null
}

export type ArrowDir = 'prev' | 'next'

export interface FramesAtlas extends SpriteAtlas {
  size: { w: number; h: number }
  crop: Rect
  minScale: number
  bleed: Sides
  panelBackground: string
  background: Drawable
  backgroundBleed: Drawable | null
  /** Moldura grande do certificado aberto (já no fundo). */
  frame: Rect
  /** Papel decorado do certificado aberto: um frame por tema, em ciclo pelo índice (j mod themes). */
  paper: { rect: Rect; themes: string[]; frames: Record<string, Placed> }
  /** Texto do DOM sobre o papel: "CERTIFICADO" na fita, título, descrição, emissor e data. */
  text: { kicker: Rect; title: Rect; desc: Rect; issuer: Rect; date: Rect }
  /** Link "Abrir PDF" (DOM). */
  pdf: Rect
  /** Texto "1 / 5" (DOM) e a plaquinha (já no fundo). */
  counter: { text: Rect; plaque: Rect }
  /** Setas: `rect` = botão do DOM; o normal já está no fundo, `hover` por cima no hover/foco. */
  arrows: Record<ArrowDir, PlacedHover>
  thumbs: {
    slots: number
    /** Botão de cada vaga (já deslocado). */
    rects: Rect[]
    /** Deslocamento de cada vaga em relação à vaga 0 (px de arte). */
    offsets: { x: number; y: number }[]
    styles: string[]
    /** Arte de cada estilo, na vaga 0. */
    frames: Record<string, PlacedHover>
    /** Vaga do certificado aberto (vazia, com anel), na vaga 0. */
    selected: Placed
  }
  textInk: { title: string; body: string; counter: string; kicker: string }
}

// Valores da spec (specs/7-quadros.md), usados quando o JSON não traz o campo.
export const FRAMES_SPEC = {
  size: { w: 320, h: 180 },
  minScale: 3,
  panelBackground: '#f6f2ec',
  frame: R(14, 14, 204, 142),
  paper: { rect: R(30, 30, 172, 110), themes: ['teal', 'red', 'blue', 'leaf'] },
  text: {
    kicker: R(76, 35, 80, 8),
    title: R(42, 48, 148, 20),
    desc: R(42, 74, 148, 22),
    issuer: R(44, 97, 64, 9),
    date: R(124, 97, 64, 9),
  },
  pdf: R(42, 113, 64, 16),
  counter: { text: R(97, 162, 38, 8), plaque: R(92, 160, 48, 12) },
  arrows: {
    prev: { rect: R(72, 158, 16, 16), hover: R(70, 156, 20, 20) },
    next: { rect: R(144, 158, 16, 16), hover: R(142, 156, 20, 20) },
  },
  thumbs: { slots: 8, size: { w: 32, h: 24 }, styles: ['wood', 'graphite', 'gold'] },
  textInk: { title: '#2f2c3a', body: '#1f4a5c', counter: '#2f2c3a', kicker: '#f6f2ec' },
} as const

/** Rect da vaga `j` pela fórmula da spec: 2 colunas × 4 linhas, passo 40. */
export const thumbSlotRect = (j: number): Rect => R(234 + 40 * (j % 2), 18 + 40 * Math.floor(j / 2), 32, 24)

function toPlaced(v: unknown, rect: Rect = R(0, 0, 0, 0)): Placed | null {
  if (!isObj(v) || typeof v.frame !== 'string') return null
  return { rect: toRect(v.rect, rect), frame: v.frame }
}

function toPlacedHover(v: unknown, rect?: Rect): PlacedHover | null {
  const p = toPlaced(v, rect)
  if (!p) return null
  return { ...p, hover: isObj(v) ? toPlaced(v.hover, p.rect) : null }
}

/**
 * Normaliza o JSON do atlas dos quadros.
 * @param json conteúdo do `.json` (Aseprite Hash ou Array com `filename`)
 * @param jsonUrl caminho do `.json`, para resolver `meta.image`
 */
export function parseFramesAtlas(json: unknown, jsonUrl: string): FramesAtlas {
  const { image, sheet, frames, qp } = parseAtlasBase(json, jsonUrl)
  const S = FRAMES_SPEC
  const size = toSize(qp.size, S.size)
  const counter = obj(qp.counter)
  const arrows = obj(qp.arrows)
  const thumbs = obj(qp.thumbs)
  const textInk = obj(qp.textInk)
  const paper = obj(qp.paper)
  const text = obj(qp.text)
  const paperThemes = Array.isArray(paper.themes) && paper.themes.length > 0 && paper.themes.every((t) => typeof t === 'string')
    ? (paper.themes as string[])
    : [...S.paper.themes]
  const paperRect = toRect(paper.rect, S.paper.rect)
  const rawPapers = obj(paper.frames)
  const paperFrames: Record<string, Placed> = {}
  for (const t of paperThemes) paperFrames[t] = toPlaced(rawPapers[t], paperRect) ?? { rect: paperRect, frame: `paper/${t}` }

  const arrow = (dir: ArrowDir): PlacedHover => {
    const v = obj(arrows[dir])
    const rect = toRect(v.rect, S.arrows[dir].rect)
    const hover = toPlaced(v.hover, S.arrows[dir].hover) ?? { rect: S.arrows[dir].hover, frame: `arrow/${dir}/hover` }
    return { rect, frame: str(v.frame, `arrow/${dir}`), hover }
  }

  const slots = num(thumbs.slots, S.thumbs.slots)
  const rawRects = Array.isArray(thumbs.rects) ? thumbs.rects : []
  const rects = Array.from({ length: slots }, (_, j) => toRect(rawRects[j], thumbSlotRect(j)))
  const rawOffsets = Array.isArray(thumbs.offsets) ? thumbs.offsets : []
  const offsets = rects.map((r, j) => {
    const o: unknown = rawOffsets[j]
    if (Array.isArray(o) && o.length === 2) return { x: num(o[0], 0), y: num(o[1], 0) }
    return { x: r.x - rects[0].x, y: r.y - rects[0].y }
  })
  const styles = Array.isArray(thumbs.styles) && thumbs.styles.every((s) => typeof s === 'string') && thumbs.styles.length > 0
    ? (thumbs.styles as string[])
    : [...S.thumbs.styles]
  const thumbFrames: Record<string, PlacedHover> = {}
  const rawFrames = obj(thumbs.frames)
  for (const style of styles) {
    thumbFrames[style] = toPlacedHover(rawFrames[style]) ?? {
      rect: R(232, 11, 34, 33),
      frame: `thumb/${style}`,
      hover: { rect: R(232, 11, 36, 33), frame: `thumb/${style}/hover` },
    }
  }

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
    frame: toRect(obj(qp.frame).rect, S.frame),
    paper: { rect: paperRect, themes: paperThemes, frames: paperFrames },
    text: {
      kicker: toRect(text.kicker, S.text.kicker),
      title: toRect(text.title, S.text.title),
      desc: toRect(text.desc, S.text.desc),
      issuer: toRect(text.issuer, S.text.issuer),
      date: toRect(text.date, S.text.date),
    },
    pdf: toRect(obj(qp.pdf).rect, S.pdf),
    counter: { text: toRect(counter.text, S.counter.text), plaque: toRect(obj(counter.plaque).rect, S.counter.plaque) },
    arrows: { prev: arrow('prev'), next: arrow('next') },
    thumbs: {
      slots,
      rects,
      offsets,
      styles,
      frames: thumbFrames,
      selected: toPlaced(obj(thumbs.selected), R(232, 11, 36, 33)) ?? { rect: R(232, 11, 36, 33), frame: 'thumb/selected' },
    },
    textInk: {
      title: str(textInk.title, S.textInk.title),
      body: str(textInk.body, S.textInk.body),
      counter: str(textInk.counter, S.textInk.counter),
      kicker: str(textInk.kicker, S.textInk.kicker),
    },
  }
}

// ---------- Papel ----------

/** Tema do papel do certificado `j` (petróleo, vermelho, azul, verde, em ciclo). */
export const paperTheme = (atlas: FramesAtlas, j: number) => atlas.paper.themes[((j % atlas.paper.themes.length) + atlas.paper.themes.length) % atlas.paper.themes.length]

// ---------- Miniaturas ----------

/** Estilo da moldura da vaga `j` (madeira, grafite, dourada, em ciclo). */
export const thumbStyle = (atlas: FramesAtlas, j: number) => atlas.thumbs.styles[j % atlas.thumbs.styles.length]

/** Quantas miniaturas aparecem para `count` certificados (só as primeiras `slots`). */
export const thumbCount = (atlas: FramesAtlas, count: number) => Math.max(0, Math.min(count, atlas.thumbs.slots))

/** Arte da vaga `j` (normal, hover ou a vaga vazia do aberto), com o rect já deslocado. */
export function thumbArt(atlas: FramesAtlas, j: number, open: number, hot: boolean): Placed {
  const o = atlas.thumbs.offsets[j] ?? { x: 0, y: 0 }
  const art = atlas.thumbs.frames[thumbStyle(atlas, j)]
  const p = j === open ? atlas.thumbs.selected : hot && art.hover ? art.hover : art
  return { frame: p.frame, rect: { ...p.rect, x: p.rect.x + o.x, y: p.rect.y + o.y } }
}

// ---------- Navegação ----------

/** Próximo certificado (presa nas pontas, sem dar a volta). */
export const stepAward = (current: number, dir: 1 | -1, total: number) => Math.min(Math.max(current + dir, 0), Math.max(total - 1, 0))

/** Se a seta `dir` leva a outro certificado. */
export const canStep = (current: number, dir: ArrowDir, total: number) => (dir === 'prev' ? current > 0 : current < total - 1)

// ---------- Composição ----------

export type FramesLayerRole = 'background' | 'paper' | 'thumb' | 'arrow'

export interface FramesLayer extends CueFlags {
  key: string
  role: FramesLayerRole
  frame: string
  /** Deslocamento (px de arte) da vaga da miniatura; os demais, 0. */
  dx: number
  dy: number
}

export interface FramesComposeOptions {
  /** Quantidade de certificados. */
  count: number
  /** Índice do certificado aberto. */
  open: number
  night: boolean
  /** Entardecer: fundo e setas em `dusk` (dia × tint-dusk). */
  dusk?: boolean
  /** Miniatura em hover/foco. */
  hotThumb?: number | null
  /** Seta em hover/foco (só desenhada se navegar para algum lugar). */
  hotArrow?: ArrowDir | null
}

/**
 * Ordem da spec: fundo (com a sangria real) → papel decorado do aberto (tema j mod 4) → miniaturas (a do aberto = vaga vazia com anel)
 * deslocadas pela vaga → anel das setas que navegam. Clicáveis (miniaturas fechadas, setas) ganham
 * o anel branco (regra 14) em vez dos frames `.hover` dourados; a seta normal já está no fundo,
 * então dela só sai o anel. Vagas sem certificado ficam vazias. Frames ausentes do atlas são
 * pulados. Só o fundo muda à noite (o papel fica na poça de luz).
 */
export function composeFrames(atlas: FramesAtlas, { count, open, night, dusk = false, hotThumb = null, hotArrow = null }: FramesComposeOptions): FramesLayer[] {
  const layers: FramesLayer[] = []
  const push = (l: FramesLayer) => {
    if (atlas.frames[l.frame]) layers.push(l)
  }
  const pick = (d: Drawable) => pickPeriod(d, night, dusk)
  const bgBleed = atlas.backgroundBleed && atlas.frames[pick(atlas.backgroundBleed)] ? atlas.backgroundBleed : null
  push({ key: 'bg', role: 'background', frame: pick(bgBleed ?? atlas.background), dx: 0, dy: 0 })
  if (count > 0) push({ key: 'paper', role: 'paper', frame: atlas.paper.frames[paperTheme(atlas, open)].frame, dx: 0, dy: 0 })

  for (let j = 0; j < thumbCount(atlas, count); j++) {
    const o = atlas.thumbs.offsets[j] ?? { x: 0, y: 0 }
    const cue = j !== open
    push({
      key: `thumb:${j}`,
      role: 'thumb',
      frame: thumbArt(atlas, j, open, false).frame,
      dx: o.x,
      dy: o.y,
      cue: cue || undefined,
      hot: (cue && hotThumb === j) || undefined,
    })
  }
  for (const dir of ['prev', 'next'] as const) {
    if (!canStep(open, dir, count)) continue
    const a = atlas.arrows[dir]
    push({ key: `arrow:${dir}`, role: 'arrow', frame: a.frame, dx: 0, dy: 0, cue: true, ringOnly: true, hot: hotArrow === dir || undefined })
  }
  return layers
}

// ---------- Geometria da visão de perto (regra "cover", layout.ts) ----------

/** Sangria sintética máxima (px de arte), igual à do caderno. */
export const FRAMES_MAX_BLEED = 48

/** Área que precisa ficar inteira visível: moldura, plaquinha, setas (hover) e todas as vagas. */
export function framesContentRect(atlas: FramesAtlas): Rect {
  const rects: Rect[] = [atlas.frame, atlas.counter.plaque]
  for (const dir of ['prev', 'next'] as const) {
    const a = atlas.arrows[dir]
    rects.push(a.rect)
    if (a.hover) rects.push(a.hover.rect)
  }
  for (let j = 0; j < atlas.thumbs.slots; j++) {
    const o = atlas.thumbs.offsets[j] ?? { x: 0, y: 0 }
    const shift = (r: Rect) => ({ ...r, x: r.x + o.x, y: r.y + o.y })
    rects.push(atlas.thumbs.rects[j], shift(atlas.thumbs.selected.rect))
    for (const art of Object.values(atlas.thumbs.frames)) {
      rects.push(shift(art.rect))
      if (art.hover) rects.push(shift(art.hover.rect))
    }
  }
  return unionRect(...rects)
}

/** Geometria para `pickCloseupLayout`. */
export function framesGeometry(atlas: FramesAtlas): CloseupGeometry {
  return {
    size: atlas.size,
    contentRect: framesContentRect(atlas),
    crops: { full: atlas.crop },
    minContent: { w: 0, h: 0 },
    minScale: atlas.minScale,
    bleed: atlas.bleed,
    maxBleed: FRAMES_MAX_BLEED,
  }
}
