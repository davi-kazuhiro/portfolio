import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { CuedSprite } from '@/ui/closeup/CueRing'
import { composeDeskItem, type DeskArrowDir, type DeskItemAtlas, type FloatSpec } from '@/ui/closeup/deskItemAtlas'
import { unionRect, type CloseupLayout } from '@/ui/closeup/layout'
import { place } from '@/ui/closeup/spriteStyle'
import { useSwipe } from '@/ui/closeup/useSwipe'
import { sceneFontSize } from '../bookshelf/skills'
import { captionLines, type DeskItemModel } from './model'

type CssVars = CSSProperties & Record<`--${string}`, string>

/** Variáveis do wrapper que flutua; fase vira `animation-delay` negativo. */
const floatStyle = (f: FloatSpec): CssVars => ({
  '--float-amp': `${f.amplitude}`,
  '--float-ms': `${f.periodMs}ms`,
  '--float-delay': `${-f.phaseMs}ms`,
})

// Ilustração em escala inteira cobrindo a janela (regra cover): fundo → objeto 3D flutuando → setas →
// item aberto flutuando (como o hobby da prateleira) → DOM (palco focável, legenda, setas).
// Ordem de Tab: Fechar → palco → seta anterior → seta próxima.
export function DeskItemScene({ model, atlas, layout }: { model: DeskItemModel; atlas: DeskItemAtlas; layout: CloseupLayout }) {
  const { t } = useTranslation()
  const [hoverArrow, setHoverArrow] = useState<DeskArrowDir | null>(null)
  const [focusArrow, setFocusArrow] = useState<DeskArrowDir | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  const { entries, open, ns } = model
  const total = entries.length
  const cur = entries[open] ?? null
  const s = layout.scale
  const origin = { x: layout.crop.x, y: layout.crop.y }

  const layers = composeDeskItem(atlas, { open: cur?.id ?? null, night: model.night, dusk: model.dusk, count: total, hotArrow: hoverArrow ?? focusArrow })

  // Foco inicial no palco (←/→ já trocam o item).
  useEffect(() => {
    stageRef.current?.focus()
  }, [])

  const swipe = useSwipe(model.step)

  const viewStyle: CssVars = {
    ...place(layout.crop, s, origin),
    left: layout.view.x,
    top: layout.view.y,
    fontSize: sceneFontSize(s),
    '--px': `${s}px`,
  }

  const onStageKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      model.step(e.key === 'ArrowLeft' ? -1 : 1)
    }
  }

  const lines = cur ? captionLines(cur, model.lines) : []
  const itemRect = cur ? atlas.items.rects[cur.id] : undefined
  const stageRect = itemRect ? unionRect(atlas.stage.front, itemRect) : atlas.stage.front
  const position = t(`${ns}.itemOf`, { current: open + 1, total })
  const detailsId = `${ns}-details`

  return (
    <div className="desk-item">
      <h2 id={model.titleId} className="visually-hidden">
        {t(`${ns}.title`)}
      </h2>
      <button type="button" className="pixel-btn shelf__close" onClick={model.onClose}>
        {t('hud.close')}
      </button>
      <div className="desk-item__view" style={viewStyle} {...swipe}>
        {layers.map((l) => {
          const sprite = (
            <CuedSprite
              key={l.key}
              atlas={atlas}
              frame={l.frame}
              s={s}
              crop={layout.crop}
              bleed={l.role === 'background' ? layout.bleed : undefined}
              cue={l.cue}
              hot={l.hot}
            />
          )
          // Objeto 3D e item aberto flutuando: o wrapper cobre a cena e só ele se move (sombras
          // paradas no fundo). Amplitude, período e fase vêm do atlas; parado com reduced motion.
          return l.float ? (
            <div key={l.key} className="shelf__float desk-item__float" aria-hidden="true" style={floatStyle(l.float)}>
              {sprite}
            </div>
          ) : (
            sprite
          )
        })}

        <div
          ref={stageRef}
          className="shelf__group desk-item__stage"
          role="img"
          aria-label={cur ? `${lines.join(', ')}. ${position}` : t(`${ns}.empty`)}
          aria-describedby={cur && cur.details.length > 0 ? detailsId : undefined}
          tabIndex={0}
          style={place(stageRect, s, origin)}
          onKeyDown={onStageKey}
        />
        {cur && cur.details.length > 0 && (
          <p id={detailsId} className="visually-hidden">
            {cur.details.join('. ')}
          </p>
        )}

        <div className="shelf__caption desk-item__caption" aria-hidden="true" style={place(atlas.stage.caption, s, origin)}>
          {cur ? (
            lines.map((line, i) => (
              <span key={i} className={i === 0 ? 'desk-item__line' : 'desk-item__line desk-item__line--sub'}>
                {line}
              </span>
            ))
          ) : (
            <span className="desk-item__line desk-item__line--sub">{t(`${ns}.empty`)}</span>
          )}
        </div>

        {total > 1 &&
          (['prev', 'next'] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              className="shelf__arrow"
              style={place(atlas.arrows[dir].hit, s, origin)}
              aria-label={t(`${ns}.${dir}`)}
              onClick={() => model.step(dir === 'prev' ? -1 : 1)}
              onMouseEnter={() => setHoverArrow(dir)}
              onMouseLeave={() => setHoverArrow((a) => (a === dir ? null : a))}
              onFocus={() => setFocusArrow(dir)}
              onBlur={() => setFocusArrow((a) => (a === dir ? null : a))}
            />
          ))}
      </div>
    </div>
  )
}
