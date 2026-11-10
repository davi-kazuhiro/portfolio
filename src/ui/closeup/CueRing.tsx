import type { ComponentProps } from 'react'
import type { CueFlags, SpriteAtlas } from './atlas'
import { useCueRing } from './cueRingMask'
import type { Rect } from './layout'
import { SceneSprite } from './SceneSprite'

/** Camada de cena com o anel de clicável (se `cue`) logo abaixo; `ringOnly` desenha só o anel. */
export function CuedSprite({ cue, hot, ringOnly, cueEdge, ...sprite }: ComponentProps<typeof SceneSprite> & CueFlags) {
  return (
    <>
      {cue && (
        <CueRing
          atlas={sprite.atlas}
          frame={sprite.frame}
          s={sprite.s}
          crop={sprite.crop}
          dx={sprite.dx}
          dy={sprite.dy}
          lifted={sprite.lifted}
          hot={hot}
          edge={cueEdge}
        />
      )}
      {!ringOnly && <SceneSprite {...sprite} />}
    </>
  )
}

/**
 * Anel branco piscando em volta de um frame clicável de uma visão de perto (1 px de arte por
 * fora da silhueta). Vai logo abaixo do sprite, na mesma posição (`dx`/`dy`/`lifted` iguais aos
 * do SceneSprite). `hot` (hover/foco) para o pulso e deixa o anel aceso. `edge` acrescenta a
 * borda escura por fora (fundos claros). Decorativo.
 */
export function CueRing({
  atlas,
  frame,
  s,
  crop,
  dx = 0,
  dy = 0,
  lifted = false,
  hot = false,
  edge = false,
}: {
  atlas: SpriteAtlas
  frame: string
  s: number
  crop: Rect
  dx?: number
  dy?: number
  lifted?: boolean
  hot?: boolean
  edge?: boolean
}) {
  const url = useCueRing(atlas, frame, edge)
  const pad = edge ? 2 : 1
  const f = atlas.frames[frame]
  if (!f || !url) return null
  const left = (f.x + dx - pad - crop.x) * s
  const top = (f.y + dy - pad - crop.y - (lifted ? 4 : 0)) * s
  const cls = `interact-cue${hot ? ' interact-cue--hot' : ''}${lifted ? ' scene-sprite--lifted' : ''}`
  return (
    <div
      className={cls}
      aria-hidden="true"
      style={{
        left,
        top,
        width: (f.w + pad * 2) * s,
        height: (f.h + pad * 2) * s,
        backgroundImage: `url("${url}")`,
        backgroundSize: '100% 100%',
      }}
    />
  )
}
