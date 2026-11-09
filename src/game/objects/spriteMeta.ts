import type * as Phaser from 'phaser'
import type { Rect } from '../systems/cameraMath'

// Leitura do contrato dos sprites gerados (docs/arte/biblia-de-arte.md, "Formato"):
// PNG + JSON Hash do Aseprite. O Phaser copia o JSON (menos `frames`) para `texture.customData`,
// então `meta.quartoPixel` e `meta.frameTags` ficam em `texture.customData.meta`.

// `surface`: objeto sobre móvel (caderno na mesa). Âncora no centro do footprint do móvel e
// profundidade = a do móvel (`surfaceOf`) + `depthOffset` (bíblia, "Objeto sobre móvel").
export type Mount = 'floor' | 'wall-back' | 'wall-left' | 'surface'
const MOUNTS: readonly Mount[] = ['floor', 'wall-back', 'wall-left', 'surface']
// Padrão de `depthOffset` quando um objeto `surface` não traz o valor.
export const SURFACE_DEPTH_OFFSET = 0.01

export interface QuartoPixelMeta {
  footprint?: number[][]
  anchor?: [number, number]
  mount?: Mount
  // Só com `mount: "surface"`: chave do móvel embaixo e quanto fica acima dele.
  surfaceOf?: string
  depthOffset?: number
  hit?: 'alpha' | 'none' | number[][]
  minHit?: [number, number]
  // Retângulo de foco da câmera, em px do canvas (x, y, w, h).
  focus?: Rect
  // Camada de outro sprite (mesmo canvas e âncora): chave do principal.
  layerOf?: string
  // Fonte de luz: fica fora do tint de entardecer/noite.
  light: boolean
  // Camada que acompanha o frame da animação do principal (ex.: `light-computer`).
  syncFramesWith?: string
}

export interface FrameTag {
  name: string
  from: number
  to: number
  direction?: string
}

interface AsepriteMeta {
  quartoPixel?: Record<string, unknown>
  frameTags?: FrameTag[]
}

function metaOf(texture: Phaser.Textures.Texture): AsepriteMeta {
  const meta = (texture.customData as { meta?: AsepriteMeta } | undefined)?.meta
  return meta ?? {}
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

// `focus` aceita [x, y, w, h] ou { x, y, w|width, h|height } em px do canvas.
export function parseFocusRect(value: unknown): Rect | undefined {
  if (Array.isArray(value) && value.length === 4 && value.every(isNum)) {
    const [x, y, width, height] = value as number[]
    return width > 0 && height > 0 ? { x, y, width, height } : undefined
  }
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>
    const width = v.width ?? v.w
    const height = v.height ?? v.h
    if (isNum(v.x) && isNum(v.y) && isNum(width) && isNum(height) && width > 0 && height > 0) {
      return { x: v.x, y: v.y, width, height }
    }
  }
  return undefined
}

export function readQuartoPixel(texture: Phaser.Textures.Texture): QuartoPixelMeta {
  const raw = metaOf(texture).quartoPixel ?? {}
  const pair = (v: unknown): [number, number] | undefined =>
    Array.isArray(v) && v.length === 2 && v.every(isNum) ? [v[0] as number, v[1] as number] : undefined
  return {
    footprint: Array.isArray(raw.footprint) ? (raw.footprint as number[][]) : undefined,
    anchor: pair(raw.anchor),
    mount: MOUNTS.includes(raw.mount as Mount) ? (raw.mount as Mount) : undefined,
    surfaceOf: typeof raw.surfaceOf === 'string' ? raw.surfaceOf : undefined,
    depthOffset: isNum(raw.depthOffset) ? raw.depthOffset : undefined,
    hit: raw.hit as QuartoPixelMeta['hit'],
    minHit: pair(raw.minHit),
    focus: parseFocusRect(raw.focus),
    layerOf: typeof raw.layerOf === 'string' ? raw.layerOf : undefined,
    light: raw.light === true,
    syncFramesWith: typeof raw.syncFramesWith === 'string' ? raw.syncFramesWith : undefined,
  }
}

// Nomes dos frames na ordem do JSON (o índice das tags se refere a essa ordem). A bíblia usa
// chaves "<id> <n>"; o `createFromAseprite` do Phaser só entende chaves "0", "1"…, por isso as
// animações são montadas aqui.
export function frameNames(texture: Phaser.Textures.Texture): string[] {
  return texture.getFrameNames(false)
}

export function frameTags(texture: Phaser.Textures.Texture): FrameTag[] {
  const tags = metaOf(texture).frameTags
  return Array.isArray(tags) ? tags.filter((t) => typeof t?.name === 'string') : []
}

// Duração de cada frame, do JSON do Aseprite (cache.json, chave = chave da textura).
function frameDurations(scene: Phaser.Scene, key: string): Record<string, number> {
  const json = scene.cache.json.get(key) as { frames?: Record<string, { duration?: number }> } | undefined
  const out: Record<string, number> = {}
  for (const [name, f] of Object.entries(json?.frames ?? {})) {
    if (isNum(f?.duration)) out[name] = f.duration
  }
  return out
}

export function tagFrames(texture: Phaser.Textures.Texture, tag: FrameTag): string[] {
  const names = frameNames(texture)
  const out: string[] = []
  for (let i = tag.from; i <= tag.to; i++) if (names[i]) out.push(names[i])
  if (tag.direction === 'reverse') out.reverse()
  return out
}

// Cria as animações das tags no próprio sprite (animações locais: tags com o mesmo nome, como
// `idle`, em arquivos diferentes não colidem no AnimationManager global).
export function createLocalAnims(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite) {
  const texture = sprite.texture
  const durations = frameDurations(scene, texture.key)
  for (const tag of frameTags(texture)) {
    const frames = tagFrames(texture, tag)
    if (frames.length < 2 || sprite.anims.exists(tag.name)) continue
    // Mesma montagem do `createFromAseprite`: duração por frame + duração total.
    const animFrames = frames.map((frame) => ({ key: texture.key, frame, duration: durations[frame] ?? 100 }))
    sprite.anims.create({
      key: tag.name,
      frames: animFrames,
      duration: animFrames.reduce((sum, f) => sum + f.duration, 0),
      repeat: -1,
      yoyo: tag.direction === 'pingpong',
    })
  }
}
