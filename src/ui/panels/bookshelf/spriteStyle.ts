import type { CSSProperties } from 'react'
import type { Rect } from '@/ui/closeup/layout'
import type { AtlasFrame, ShelfAtlas } from '@/ui/closeup/shelfAtlas'

/** Estilo de fundo que mostra `frame` do atlas ampliado por `k` (inteiro). */
export function frameBackground(atlas: ShelfAtlas, f: AtlasFrame, k: number): CSSProperties {
  return {
    width: f.w * k,
    height: f.h * k,
    backgroundImage: `url("${atlas.image}")`,
    backgroundPosition: `${-f.sx * k}px ${-f.sy * k}px`,
    backgroundSize: `${atlas.sheet.w * k}px ${atlas.sheet.h * k}px`,
  }
}

/** Retângulo da ilustração → posição em px CSS dentro de um contêiner com origem em `origin`. */
export function place(r: Rect, s: number, origin: { x: number; y: number } = { x: 0, y: 0 }): CSSProperties {
  return { left: (r.x - origin.x) * s, top: (r.y - origin.y) * s, width: r.w * s, height: r.h * s }
}
