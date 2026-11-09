// Contrato da ilustração da visão de perto (docs/arte/specs.md §3): PNG com os frames lado a lado
// + JSON Hash do Aseprite com `meta.frameTags` e `meta.quartoPixel` (contentRect, crops, 9-slice).
// `parseCloseupSheet` normaliza o JSON; o que faltar cai nos valores da spec.
import type { CloseupGeometry, Rect } from './layout'

export interface SheetFrame {
  /** Posição do frame no PNG (px a 1×). */
  x: number
  y: number
  duration: number
}

export interface NineSlice {
  image: string
  size: { w: number; h: number }
  /** Larguras das fatias em px a 1×. */
  slice: { top: number; right: number; bottom: number; left: number }
  /** Escala inteira das bordas (spec: 2×). */
  scale: number
}

/** Animação pequena por cima da ilustração (vapor da caneca): frames lado a lado. */
export interface Overlay {
  image: string
  /** Posição na ilustração (px a 1×). */
  at: { x: number; y: number }
  frame: { w: number; h: number }
  count: number
  duration: number
}

export interface CloseupSheet extends CloseupGeometry {
  image: string
  /** Tamanho do PNG inteiro (px a 1×). */
  sheet: { w: number; h: number }
  /** Frames por tag (`off`, `boot`, `on`, `off-night`...). */
  tags: Record<string, SheetFrame[]>
  frame9: NineSlice
  steam?: Overlay
}

// Valores da spec, usados quando o JSON não traz o campo.
export const SPEC = {
  size: { w: 320, h: 180 },
  minContent: { w: 640, h: 360 },
  minScale: 3,
  contentRect: { x: 58, y: 13, w: 204, h: 92 },
  crops: { full: { x: 0, y: 0, w: 320, h: 180 }, monitor: { x: 44, y: 0, w: 232, h: 180 } },
  frame9: { size: { w: 48, h: 48 }, slice: { top: 9, right: 8, bottom: 15, left: 8 }, scale: 2 },
} as const

type Json = Record<string, unknown>
const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d)

/** Aceita `[w, h]` ou `{ w, h }`. */
function toSize(v: unknown, d: { w: number; h: number }) {
  if (Array.isArray(v) && v.length === 2) return { w: num(v[0], d.w), h: num(v[1], d.h) }
  if (isObj(v)) return { w: num(v.w, d.w), h: num(v.h, d.h) }
  return { ...d }
}

/** Aceita `[x, y, w, h]` ou `{ x, y, w, h }`. */
export function toRect(v: unknown, fallback: Rect): Rect {
  if (Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === 'number')) {
    const [x, y, w, h] = v as number[]
    return { x, y, w, h }
  }
  if (isObj(v)) return { x: num(v.x, fallback.x), y: num(v.y, fallback.y), w: num(v.w, fallback.w), h: num(v.h, fallback.h) }
  return { ...fallback }
}

/** Sangria real `{ left, top, right, bottom }` (px de arte, ≥ 0; campo ausente = 0). */
export function toSides(v: unknown): { top: number; right: number; bottom: number; left: number } {
  const o = isObj(v) ? v : {}
  const n = (k: string) => Math.max(0, Math.floor(num(o[k], 0)))
  return { top: n('top'), right: n('right'), bottom: n('bottom'), left: n('left') }
}

function toSlice(v: unknown, d: NineSlice['slice']): NineSlice['slice'] {
  // Ordem CSS: topo, direita, base, esquerda.
  if (Array.isArray(v) && v.length === 4) {
    const [top, right, bottom, left] = v.map((n, i) => num(n, [d.top, d.right, d.bottom, d.left][i]))
    return { top, right, bottom, left }
  }
  if (isObj(v)) return { top: num(v.top, d.top), right: num(v.right, d.right), bottom: num(v.bottom, d.bottom), left: num(v.left, d.left) }
  return { ...d }
}

/** Resolve `name` relativo ao diretório de `baseUrl` (o JSON). */
export function resolveSibling(baseUrl: string, name: string): string {
  if (/^(data:|blob:|https?:|\/)/.test(name)) return name
  const dir = baseUrl.includes('/') ? baseUrl.slice(0, baseUrl.lastIndexOf('/') + 1) : ''
  return dir + name
}

/**
 * Normaliza o JSON da ilustração.
 * @param json conteúdo do `.json` (Aseprite Hash ou Array)
 * @param jsonUrl caminho do `.json`, para resolver `meta.image`
 * @param frameUrl caminho padrão do PNG da moldura 9-slice
 */
export function parseCloseupSheet(json: unknown, jsonUrl: string, frameUrl: string): CloseupSheet {
  const root = isObj(json) ? json : {}
  const meta = isObj(root.meta) ? root.meta : {}
  const qp = isObj(meta.quartoPixel) ? meta.quartoPixel : {}

  // Frames na ordem do arquivo (Hash preserva a ordem de inserção).
  const rawFrames = Array.isArray(root.frames) ? root.frames : isObj(root.frames) ? Object.values(root.frames) : []
  const frames: SheetFrame[] = rawFrames.filter(isObj).map((f) => {
    const r = toRect(f.frame, { x: 0, y: 0, w: 0, h: 0 })
    return { x: r.x, y: r.y, duration: num(f.duration, 100) }
  })

  const tags: Record<string, SheetFrame[]> = {}
  for (const tag of Array.isArray(meta.frameTags) ? meta.frameTags : []) {
    if (!isObj(tag) || typeof tag.name !== 'string') continue
    const from = num(tag.from, 0), to = num(tag.to, from)
    tags[tag.name] = frames.slice(from, to + 1)
  }
  if (Object.keys(tags).length === 0 && frames.length > 0) tags.on = [frames[0]]

  const firstFrame = rawFrames.find(isObj)
  const sourceSize = firstFrame && isObj(firstFrame.sourceSize) ? firstFrame.sourceSize : {}
  const size = toSize(qp.size, toSize(sourceSize, SPEC.size))
  const metaSize = isObj(meta.size) ? meta.size : {}
  const sheet = { w: num(metaSize.w, size.w * Math.max(frames.length, 1)), h: num(metaSize.h, size.h) }

  const crops = isObj(qp.crops) ? qp.crops : {}
  const n9 = isObj(qp.nineSlice) ? qp.nineSlice : isObj(qp.frame9) ? qp.frame9 : isObj(qp.frame) ? qp.frame : {}

  return {
    image: resolveSibling(jsonUrl, typeof meta.image === 'string' ? meta.image : jsonUrl.slice(jsonUrl.lastIndexOf('/') + 1).replace(/\.json$/, '.png')),
    sheet,
    size,
    contentRect: toRect(qp.contentRect, SPEC.contentRect),
    minContent: toSize(qp.minContentCss, SPEC.minContent),
    minScale: num(qp.minScale, SPEC.minScale),
    crops: {
      full: toRect(crops.full ?? crops.A ?? crops.scene, { x: 0, y: 0, w: size.w, h: size.h }),
      monitor: toRect(crops.monitor ?? crops.B, SPEC.crops.monitor),
    },
    tags,
    frame9: {
      image: typeof n9.image === 'string' ? resolveSibling(jsonUrl, n9.image) : frameUrl,
      size: toSize(n9.size, SPEC.frame9.size),
      slice: toSlice(n9.slice ?? n9.slices, SPEC.frame9.slice),
      scale: num(n9.scale, SPEC.frame9.scale),
    },
    ...(isObj(qp.bleed) ? { bleed: toSides(qp.bleed) } : {}),
  }
}

/**
 * Normaliza a sobreposição animada: `ref` vem de `meta.quartoPixel.steam` (`image`, `at`) e
 * `json` é o JSON do Aseprite dela (frames lado a lado).
 */
export function parseOverlay(ref: unknown, json: unknown, jsonUrl: string): Overlay | undefined {
  if (!isObj(ref) || typeof ref.image !== 'string') return undefined
  const root = isObj(json) ? json : {}
  const rawFrames = Array.isArray(root.frames) ? root.frames : isObj(root.frames) ? Object.values(root.frames) : []
  const first = rawFrames.find(isObj)
  const r = toRect(first?.frame, { x: 0, y: 0, w: 12, h: 12 })
  const at = Array.isArray(ref.at) ? { x: num(ref.at[0], 0), y: num(ref.at[1], 0) } : toRect(ref.at, { x: 0, y: 0, w: 0, h: 0 })
  return {
    image: resolveSibling(jsonUrl, ref.image),
    at: { x: at.x, y: at.y },
    frame: { w: r.w, h: r.h },
    count: Math.max(rawFrames.length, 1),
    duration: num(first?.duration, 200),
  }
}

/**
 * Sequência de frames ao abrir: `boot` (ou `boot-night`) e depois `on`. Durações somadas ficam
 * em no máximo `maxMs` (encurtadas na proporção). Com `reducedMotion`, vai direto para `on`.
 */
export function bootSequence(
  tags: CloseupSheet['tags'],
  night: boolean,
  reducedMotion: boolean,
  maxMs = 300,
): { boot: SheetFrame[]; on: SheetFrame | undefined } {
  const pick = (name: string) => (night ? (tags[`${name}-night`] ?? tags[name]) : tags[name]) ?? []
  const on = pick('on')[0] ?? pick('off')[0]
  if (reducedMotion) return { boot: [], on }
  const boot = pick('boot')
  const total = boot.reduce((s, f) => s + f.duration, 0)
  const k = total > maxMs ? maxMs / total : 1
  return { boot: boot.map((f) => ({ ...f, duration: Math.floor(f.duration * k) })), on }
}
