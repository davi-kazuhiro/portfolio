import type { ShelfAtlas } from '@/ui/closeup/shelfAtlas'
import { frameBackground } from './spriteStyle'

/** Camada da ilustração, posicionada pelo `spriteSourceSize` do frame. Decorativa. */
export function SceneSprite({
  atlas,
  frame,
  s,
  origin,
  lifted = false,
}: {
  atlas: ShelfAtlas
  frame: string
  s: number
  origin: { x: number; y: number }
  lifted?: boolean
}) {
  const f = atlas.frames[frame]
  if (!f) return null
  return (
    <div
      className={`shelf-sprite${lifted ? ' shelf-sprite--lifted' : ''}`}
      aria-hidden="true"
      style={{
        ...frameBackground(atlas, f, s),
        left: (f.x - origin.x) * s,
        top: (f.y - origin.y - (lifted ? 4 : 0)) * s,
      }}
    />
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
