// Base comum dos atlas das visões de perto (prateleira §4, caderno §5 de docs/arte/specs.md):
// PNG com frames recortados (trimmed) + JSON Hash do Aseprite. Cada frame traz a posição na
// ilustração 320×180 em `spriteSourceSize` (negativa na sangria). Tudo aqui é puro e testável.
import type { Rect } from './layout'
import { resolveSibling, toRect } from './sheet'

export interface AtlasFrame {
  /** Posição no PNG (px a 1×). */
  sx: number
  sy: number
  w: number
  h: number
  /** Posição na ilustração (px a 1×), de `spriteSourceSize`. */
  x: number
  y: number
}

/** O mínimo para desenhar frames: imagem, tamanho do PNG e frames por nome. */
export interface SpriteAtlas {
  image: string
  /** Tamanho do PNG (px a 1×). */
  sheet: { w: number; h: number }
  frames: Record<string, AtlasFrame>
}

/**
 * Marca de clicável numa camada de visão de perto (bíblia, regra 14): `cue` = desenhar o anel
 * branco piscando em volta do frame; `hot` = em hover/foco (anel aceso); `ringOnly` = só o anel
 * (o desenho normal já está no fundo, ex.: setas dos quadros, cantos do caderno).
 */
export interface CueFlags {
  cue?: boolean
  hot?: boolean
  ringOnly?: boolean
  /** Borda escura de 1 px por fora do anel, para fundos claros (tela do celular). */
  cueEdge?: boolean
}

/** Algo desenhado com variante de dia e de noite. */
export interface Drawable {
  rect: Rect
  day: string
  night: string
  /** Entardecer (dia × tint-dusk); ausente = `day`. */
  dusk?: string
}

/** Frame do período: noite → `night`; entardecer → `dusk` (ou `day`, se não houver); dia → `day`. */
export const pickPeriod = (d: { day: string; night: string; dusk?: string }, night: boolean, dusk = false) =>
  night ? d.night : dusk ? (d.dusk ?? d.day) : d.day

export type Json = Record<string, unknown>
export const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)
export const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
export const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d)
export const obj = (v: unknown): Json => (isObj(v) ? v : {})
export const R = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h })
export const ZERO_RECT = R(0, 0, 0, 0)

/** Aceita `[w, h]` ou `{ w, h }`. */
export function toSize(v: unknown, d: { w: number; h: number }) {
  if (Array.isArray(v) && v.length === 2) return { w: num(v[0], d.w), h: num(v[1], d.h) }
  if (isObj(v)) return { w: num(v.w, d.w), h: num(v.h, d.h) }
  return { ...d }
}

/** `{ rect, day, night, dusk }` (night e dusk ausentes = day). */
export function toDrawable(v: unknown): Drawable | null {
  if (!isObj(v) || typeof v.day !== 'string') return null
  return { rect: toRect(v.rect, ZERO_RECT), day: v.day, night: str(v.night, v.day), dusk: str(v.dusk, v.day) }
}

export interface AtlasBase extends SpriteAtlas {
  /** `meta.quartoPixel` (objeto vazio se ausente). */
  qp: Json
}

/**
 * Frames por nome (Hash: a chave; Array: `filename`), imagem resolvida ao lado do JSON e
 * `meta.quartoPixel`.
 * @param json conteúdo do `.json`
 * @param jsonUrl caminho do `.json`, para resolver `meta.image`
 */
export function parseAtlasBase(json: unknown, jsonUrl: string): AtlasBase {
  const root = obj(json)
  const meta = obj(root.meta)
  const entries: [string, unknown][] = Array.isArray(root.frames)
    ? root.frames.filter(isObj).map((f) => [str(f.filename), f])
    : isObj(root.frames)
      ? Object.entries(root.frames)
      : []
  const frames: Record<string, AtlasFrame> = {}
  for (const [name, f] of entries) {
    if (!name || !isObj(f)) continue
    const r = toRect(f.frame, ZERO_RECT)
    const src = obj(f.spriteSourceSize)
    frames[name] = { sx: r.x, sy: r.y, w: r.w, h: r.h, x: num(src.x, 0), y: num(src.y, 0) }
  }
  const metaSize = obj(meta.size)
  return {
    image: resolveSibling(jsonUrl, str(meta.image, jsonUrl.slice(jsonUrl.lastIndexOf('/') + 1).replace(/\.json$/, '.png'))),
    sheet: { w: num(metaSize.w, 0), h: num(metaSize.h, 0) },
    frames,
    qp: obj(meta.quartoPixel),
  }
}
