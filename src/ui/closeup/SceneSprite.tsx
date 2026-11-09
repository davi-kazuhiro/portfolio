import type { CSSProperties } from 'react'
import type { SpriteAtlas } from './atlas'
import { bleedStrips } from './bleed'
import type { Rect, Sides } from './layout'
import { frameBackground } from './spriteStyle'

const NONE: Sides = { top: 0, right: 0, bottom: 0, left: 0 }

/**
 * Camada da ilustração de uma visão de perto, posicionada pelo `spriteSourceSize` do frame
 * (mais `dy`, px de arte, ex.: o slot de uma aba). Decorativa. Os lados do frame que encostam na
 * borda da arte (`crop`: ilustração + sangria real) ganham a sangria sintética `bleed` (px CSS),
 * esticando a borda até a borda da janela (na prática, só o fundo).
 */
export function SceneSprite({
  atlas,
  frame,
  s,
  crop,
  dx = 0,
  dy = 0,
  lifted = false,
  bleed = NONE,
  style,
}: {
  atlas: SpriteAtlas
  frame: string
  s: number
  crop: Rect
  dx?: number
  dy?: number
  lifted?: boolean
  bleed?: Sides
  style?: CSSProperties
}) {
  const f = atlas.frames[frame]
  if (!f) return null
  const cls = `scene-sprite${lifted ? ' scene-sprite--lifted' : ''}`
  const x = f.x + dx
  const y = f.y + dy
  const left = (x - crop.x) * s
  const top = (y - crop.y - (lifted ? 4 : 0)) * s
  const ext: Sides = {
    top: y <= crop.y ? bleed.top : 0,
    left: x <= crop.x ? bleed.left : 0,
    bottom: y + f.h >= crop.y + crop.h ? bleed.bottom : 0,
    right: x + f.w >= crop.x + crop.w ? bleed.right : 0,
  }
  const strips = bleedStrips({ image: atlas.image, sheet: atlas.sheet, sx: f.sx, sy: f.sy, w: f.w, h: f.h }, s, left, top, ext)
  return (
    <>
      <div className={cls} aria-hidden="true" style={{ ...frameBackground(atlas, f, s), left, top, ...style }} />
      {strips.map((b) => (
        <div key={b.key} className={`scene-bleed${lifted ? ' scene-sprite--lifted' : ''}`} aria-hidden="true" style={b.style} />
      ))}
    </>
  )
}
