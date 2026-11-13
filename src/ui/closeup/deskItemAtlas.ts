// Atlas das visões de perto dos itens da mesa (docs/arte/specs/8-headset.md e 9-controle.md):
// `closeup-headset.{png,json}` e `closeup-controller.{png,json}`, o mesmo palco nos dois. Frames
// recortados com a posição na ilustração em `spriteSourceSize`; composição e rects em
// `meta.quartoPixel`. Tudo aqui é puro e testável.
import { isObj, num, obj, parseAtlasBase, pickPeriod, R, str, toDrawable, toSize, type CueFlags, type Drawable, type SpriteAtlas } from './atlas'
import { unionRect, type CloseupGeometry, type Rect, type Sides } from './layout'
import { toRect, toSides } from './sheet'

export type DeskArrowDir = 'prev' | 'next'

export interface DeskArrow extends Drawable {
  /** Botão do DOM (`arrows.*.rect`); o desenho fica em `frameRect` (o `rect` do Drawable). */
  hit: Rect
}

/** Flutuação de uma camada: sobe `amplitude` px de arte em `periodMs` (vai e volta), adiantada `phaseMs`. */
export interface FloatSpec {
  amplitude: number
  periodMs: number
  phaseMs: number
}

export interface DeskItemAtlas extends SpriteAtlas {
  size: { w: number; h: number }
  crop: Rect
  minScale: number
  bleed: Sides
  background: Drawable
  backgroundBleed: Drawable | null
  stage: {
    /** Frente do palco (onde o item flutua). */
    front: Rect
    /** Flutuação do item aberto. */
    float: FloatSpec
    /** Legenda (DOM), centrada no rect. */
    caption: Rect
    /** Campos de cada linha da legenda (ex.: `title`, `artist`). */
    lines: string[]
  }
  /** Objeto 3D (headset/controle), camada própria que flutua; não interativo. Null em atlas antigos (objeto no fundo). */
  object: (Drawable & { float: FloatSpec }) | null
  arrows: Record<DeskArrowDir, DeskArrow>
  items: {
    /** Ordem dos ids no atlas (o painel segue a ordem do conteúdo). */
    order: string[]
    /** Molde do frame, com `<id>` no lugar do id. */
    frame: string
    rects: Record<string, Rect>
  }
}

// Valores da spec (8-headset.md / 9-controle.md), usados quando o JSON não traz o campo.
export const DESK_ITEM_SPEC = {
  size: { w: 320, h: 180 },
  minScale: 3,
  front: R(204, 40, 64, 64),
  float: { amplitude: 4, periodMs: 1800, phaseMs: 0 },
  objectFloat: { amplitude: 4, periodMs: 1800, phaseMs: 1800 },
  caption: R(176, 112, 120, 24),
  lines: ['title'],
  arrows: {
    prev: { rect: R(178, 65, 16, 14), frameRect: R(178, 63, 18, 16) },
    next: { rect: R(282, 65, 16, 14), frameRect: R(282, 63, 18, 16) },
  },
  itemFrame: 'item/<id>',
} as const

function toFloat(v: unknown, d: FloatSpec): FloatSpec {
  const f = obj(v)
  return { amplitude: num(f.amplitude, d.amplitude), periodMs: num(f.periodMs, d.periodMs), phaseMs: num(f.phaseMs, d.phaseMs) }
}

/**
 * Normaliza o JSON do atlas do headset ou do controle.
 * @param json conteúdo do `.json` (Aseprite Hash ou Array com `filename`)
 * @param jsonUrl caminho do `.json`, para resolver `meta.image`
 */
export function parseDeskItemAtlas(json: unknown, jsonUrl: string): DeskItemAtlas {
  const { image, sheet, frames, qp } = parseAtlasBase(json, jsonUrl)
  const S = DESK_ITEM_SPEC
  const size = toSize(qp.size, S.size)
  const stage = obj(qp.stage)
  const caption = obj(stage.caption)
  const arrows = obj(qp.arrows)
  const items = obj(qp.items)
  const object = obj(qp.object)
  const objectFrame = obj(object.frame)

  const arrow = (dir: DeskArrowDir): DeskArrow => {
    const v = obj(arrows[dir])
    return {
      hit: toRect(v.rect, S.arrows[dir].rect),
      rect: toRect(v.frameRect, S.arrows[dir].frameRect),
      day: str(v.day, `arrow/${dir}`),
      night: str(v.night, str(v.day, `arrow/${dir}`)),
      dusk: str(v.dusk, str(v.day, `arrow/${dir}`)),
    }
  }

  const lines = Array.isArray(caption.lines) ? caption.lines.filter((l): l is string => typeof l === 'string') : []
  const order = Array.isArray(items.order) ? items.order.filter((l): l is string => typeof l === 'string') : []
  const rects: Record<string, Rect> = {}
  for (const [id, r] of Object.entries(obj(items.rects))) rects[id] = toRect(r, S.front)

  return {
    image,
    sheet,
    frames,
    size,
    crop: toRect(obj(qp.crops).full, R(0, 0, size.w, size.h)),
    minScale: num(qp.minScale, S.minScale),
    bleed: toSides(qp.bleed),
    background: toDrawable(qp.background) ?? { rect: R(0, 0, size.w, size.h), day: 'bg/day', night: 'bg/night' },
    backgroundBleed: isObj(qp.background) ? toDrawable(qp.background.bleed) : null,
    stage: {
      front: toRect(stage.front, S.front),
      float: toFloat(stage.float, S.float),
      caption: toRect(caption.rect, S.caption),
      lines: lines.length > 0 ? lines : [...S.lines],
    },
    object:
      typeof objectFrame.day === 'string'
        ? {
            rect: toRect(object.rect, R(0, 0, size.w, size.h)),
            day: objectFrame.day,
            night: str(objectFrame.night, objectFrame.day),
            float: toFloat(object.float, S.objectFloat),
          }
        : null,
    arrows: { prev: arrow('prev'), next: arrow('next') },
    items: { order, frame: str(items.frame, S.itemFrame), rects },
  }
}

/** Nome do frame do item `id` (`item/<id>`). */
export const itemFrame = (atlas: DeskItemAtlas, id: string) => atlas.items.frame.replace('<id>', id)

// ---------- Navegação ----------

/** Próximo índice, dando a volta nas pontas (a lista é um carrossel). */
export const cycleIndex = (current: number, dir: 1 | -1, total: number) => (total > 0 ? (current + dir + total) % total : 0)

// ---------- Composição ----------

export type DeskLayerRole = 'background' | 'object' | 'arrow' | 'item'

export interface DeskLayer extends CueFlags {
  key: string
  role: DeskLayerRole
  frame: string
  /** Dentro de um wrapper que flutua com esta especificação. */
  float?: FloatSpec
}

export interface DeskComposeOptions {
  /** Id do item aberto (null: lista vazia). */
  open: string | null
  night: boolean
  /** Entardecer: fundo e setas em `dusk` (dia × tint-dusk). */
  dusk?: boolean
  /** Quantidade de itens (setas só com mais de um). */
  count: number
  /** Seta em hover/foco. */
  hotArrow?: DeskArrowDir | null
}

/**
 * Ordem da spec: fundo (com a sangria real e as sombras paradas) → objeto 3D (dia ou noite) num
 * wrapper que flutua, defasado do item → setas (dia ou noite, com o anel de clicável) → item
 * aberto, sempre nas cores de dia, num wrapper que flutua. Frames ausentes do atlas são pulados.
 */
export function composeDeskItem(atlas: DeskItemAtlas, { open, night, dusk = false, count, hotArrow = null }: DeskComposeOptions): DeskLayer[] {
  const layers: DeskLayer[] = []
  const push = (l: DeskLayer) => {
    if (atlas.frames[l.frame]) layers.push(l)
  }
  const pick = (d: Drawable) => pickPeriod(d, night, dusk)
  const bgBleed = atlas.backgroundBleed && atlas.frames[pick(atlas.backgroundBleed)] ? atlas.backgroundBleed : null
  push({ key: 'bg', role: 'background', frame: pick(bgBleed ?? atlas.background) })
  if (atlas.object) {
    const frame = atlas.frames[pick(atlas.object)] ? pick(atlas.object) : atlas.object.day
    push({ key: 'object', role: 'object', frame, float: atlas.object.float })
  }
  if (count > 1) {
    for (const dir of ['prev', 'next'] as const) {
      const a = atlas.arrows[dir]
      const frame = atlas.frames[pick(a)] ? pick(a) : a.day
      push({ key: `arrow:${dir}`, role: 'arrow', frame, cue: true, hot: hotArrow === dir || undefined })
    }
  }
  if (open) push({ key: `item:${open}`, role: 'item', frame: itemFrame(atlas, open), float: atlas.stage.float })
  return layers
}

// ---------- Geometria da visão de perto (regra "cover", layout.ts) ----------

/** Sangria sintética máxima (px de arte), igual à dos quadros. */
export const DESK_MAX_BLEED = 48

/** Área que precisa ficar inteira visível: palco, itens, legenda e setas. O objeto 3D pode cortar. */
export function deskItemContentRect(atlas: DeskItemAtlas): Rect {
  const rects: Rect[] = [atlas.stage.front, atlas.stage.caption]
  for (const dir of ['prev', 'next'] as const) rects.push(atlas.arrows[dir].rect, atlas.arrows[dir].hit)
  rects.push(...Object.values(atlas.items.rects))
  return unionRect(...rects)
}

/** Geometria para `pickCloseupLayout`. */
export function deskItemGeometry(atlas: DeskItemAtlas): CloseupGeometry {
  return {
    size: atlas.size,
    contentRect: deskItemContentRect(atlas),
    crops: { full: atlas.crop },
    minContent: { w: 0, h: 0 },
    minScale: atlas.minScale,
    bleed: atlas.bleed,
    maxBleed: DESK_MAX_BLEED,
  }
}
