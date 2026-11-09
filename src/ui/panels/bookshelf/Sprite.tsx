import type { ShelfAtlas } from '@/ui/closeup/shelfAtlas'
import { frameBackground } from '@/ui/closeup/spriteStyle'

// A camada da cena é genérica (prateleira e caderno).
export { SceneSprite } from '@/ui/closeup/SceneSprite'

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
