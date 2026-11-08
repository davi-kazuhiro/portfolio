import { useEffect, useMemo, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import type { InteractableId } from '@/game/objects/registry'
import { useReducedMotion, useViewportSize } from './hooks'
import { HUD_BAND, pickCloseupLayout, screenFontSize } from './layout'
import { bootSequence, SPEC } from './sheet'
import { useCloseupSheet } from './useCloseupSheet'
import { useNightAtOpen } from './useNightAtOpen'

interface CloseupProps {
  id: InteractableId
  /** Recebe o elemento do diálogo (a tela): foco preso e `contains` do clique fora. */
  dialogRef: RefObject<HTMLDivElement | null>
  /** Atributos do diálogo (role, aria-*, tabIndex), definidos pelo PanelHost. */
  dialogProps: Record<string, unknown>
  onOutsideClick: () => void
  children: ReactNode
}

const SPEC_GEOMETRY = { size: SPEC.size, contentRect: SPEC.contentRect, crops: SPEC.crops }

type CssVars = CSSProperties & Record<`--${string}`, string>

// Visão de perto (ADR 0006): ilustração frontal em escala inteira e o painel dentro da área de
// conteúdo, na mesma escala. Modos A/B/C de docs/arte/specs.md §3.
export function Closeup({ id, dialogRef, dialogProps, onOutsideClick, children }: CloseupProps) {
  const sheet = useCloseupSheet(id)
  const vp = useViewportSize()
  const reduced = useReducedMotion()
  const layout = pickCloseupLayout(vp.w, vp.h, sheet ?? SPEC_GEOMETRY, HUD_BAND)
  const font = screenFontSize(layout)

  const night = useNightAtOpen()

  // Liga a tela: frames de `boot` e depois `on`. Só anima se a arte já estava pronta na
  // abertura; se chegar depois, entra direto em `on` (o painel não some depois de aparecer).
  const [bootAllowed] = useState(sheet !== null)
  const seq = useMemo(
    () => (sheet ? bootSequence(sheet.tags, night, reduced || !bootAllowed) : null),
    [sheet, night, reduced, bootAllowed],
  )
  // O passo começa em 0, então o primeiro frame de boot já sai na primeira pintura.
  const [bootStep, setBootStep] = useState(0)
  const bootFrame = seq && bootStep < seq.boot.length ? seq.boot[bootStep] : null
  useEffect(() => {
    if (!bootFrame) return
    const timer = window.setTimeout(() => setBootStep((n) => n + 1), bootFrame.duration)
    return () => clearTimeout(timer)
  }, [bootFrame])

  const frame = bootFrame ?? seq?.on
  const booting = bootFrame !== null
  const s = layout.scale
  const steam = sheet?.steam

  const screenStyle: CssVars = {
    '--screen-font': `${font}px`,
    '--icon-k': String(Math.max(2, Math.floor(font / 8))),
  }
  if (layout.mode === 'C') {
    const n = sheet?.frame9 ?? { image: '', slice: SPEC.frame9.slice, scale: SPEC.frame9.scale }
    const { top, right, bottom, left } = n.slice
    Object.assign(screenStyle, {
      borderStyle: 'solid',
      borderWidth: `${top * n.scale}px ${right * n.scale}px ${bottom * n.scale}px ${left * n.scale}px`,
      borderImage: n.image ? `url("${n.image}") ${top} ${right} ${bottom} ${left} fill / auto stretch` : undefined,
    })
  } else {
    Object.assign(screenStyle, {
      left: layout.content.x,
      top: layout.content.y,
      width: layout.content.w,
      height: layout.content.h,
    })
  }

  return (
    <div
      className={`closeup closeup--${layout.mode} closeup--${id}`}
      onClick={(e) => {
        if (!dialogRef.current?.contains(e.target as Node)) onOutsideClick()
      }}
    >
      {layout.mode !== 'C' && (
        <div
          className="closeup__view"
          style={{ left: layout.view.x, top: layout.view.y, width: layout.view.w, height: layout.view.h }}
        >
          {sheet && frame && (
            <img
              className="closeup__art"
              src={sheet.image}
              alt=""
              draggable={false}
              style={{
                width: sheet.sheet.w * s,
                height: sheet.sheet.h * s,
                left: -(frame.x + layout.crop.x) * s,
                top: -(frame.y + layout.crop.y) * s,
              }}
            />
          )}
          {steam && !reduced && !booting && (
            <div
              className="closeup__steam"
              style={
                {
                  left: (steam.at.x - layout.crop.x) * s,
                  top: (steam.at.y - layout.crop.y) * s,
                  width: steam.frame.w * s,
                  height: steam.frame.h * s,
                  '--steam-shift': `${-steam.frame.w * steam.count * s}px`,
                  '--steam-ms': `${steam.duration * steam.count}ms`,
                  '--steam-steps': String(steam.count),
                } as CssVars
              }
            >
              <img src={steam.image} alt="" draggable={false} style={{ width: steam.frame.w * steam.count * s, height: steam.frame.h * s }} />
            </div>
          )}
        </div>
      )}
      <div
        ref={dialogRef}
        {...dialogProps}
        className={`closeup__screen${booting ? ' closeup__screen--booting' : ''}`}
        style={screenStyle}
      >
        {children}
      </div>
    </div>
  )
}
