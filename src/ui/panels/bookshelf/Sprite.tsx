import { bleedStrips } from '@/ui/closeup/bleed'
import type { Rect, Sides } from '@/ui/closeup/layout'
import type { ShelfAtlas } from '@/ui/closeup/shelfAtlas'
import { frameBackground } from './spriteStyle'

const NONE: Sides = { top: 0, right: 0, bottom: 0, left: 0 }

/**
 * Camada da ilustração, posicionada pelo `spriteSourceSize` do frame. Decorativa. Os lados do
 * frame que encostam na borda da arte (`crop`: ilustração + sangria real) ganham a sangria
 * sintética `bleed` (px CSS), esticando a borda até a borda da janela (na prática, só o fundo).
 */
export function SceneSprite({
  atlas,
  frame,
  s,
  crop,
  lifted = false,
  bleed = NONE,
}: {
  atlas: ShelfAtlas
  frame: string
  s: number
  crop: Rect
  lifted?: boolean
  bleed?: Sides
}) {
  const f = atlas.frames[frame]
  if (!f) return null
  const cls = `shelf-sprite${lifted ? ' shelf-sprite--lifted' : ''}`
  const left = (f.x - crop.x) * s
  const top = (f.y - crop.y - (lifted ? 4 : 0)) * s
  const ext: Sides = {
    top: f.y <= crop.y ? bleed.top : 0,
    left: f.x <= crop.x ? bleed.left : 0,
    bottom: f.y + f.h >= crop.y + crop.h ? bleed.bottom : 0,
    right: f.x + f.w >= crop.x + crop.w ? bleed.right : 0,
  }
  const strips = bleedStrips({ image: atlas.image, sheet: atlas.sheet, sx: f.sx, sy: f.sy, w: f.w, h: f.h }, s, left, top, ext)
  return (
    <>
      <div className={cls} aria-hidden="true" style={{ ...frameBackground(atlas, f, s), left, top }} />
      {strips.map((b) => (
        <div key={b.key} className={`shelf-bleed${lifted ? ' shelf-sprite--lifted' : ''}`} aria-hidden="true" style={b.style} />
      ))}
    </>
  )
}

/** Ícone 8×8 do atlas em escala `k`; sem desenho (ou sem atlas), um quadradinho. */
export function Icon({ atlas, name, k }: { atlas: ShelfAtlas | null; name: string; k: number }) {
  const frameName = atlas?.icons[name]
  const f = frameName ? atlas?.frames[frameName] : undefined
  if (!atlas || !f) {
    return <span className="shelf-icon shelf-icon--missing" aria-hidden="true" style={{ width: 8 * k, height: 8 * k }} />
  }
  return <span className="shelf-icon" aria-hidden="true" style={frameBackground(atlas, f, k)} />
}

/** Frame inteiro em fluxo (ex.: hobby ampliado no modo texto). */
export function FrameImage({ atlas, frame, k }: { atlas: ShelfAtlas; frame: string; k: number }) {
  const f = atlas.frames[frame]
  if (!f) return null
  return <span className="shelf-frame" aria-hidden="true" style={frameBackground(atlas, f, k)} />
}
