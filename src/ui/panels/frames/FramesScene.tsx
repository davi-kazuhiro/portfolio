import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { canStep, composeFrames, thumbCount, type ArrowDir, type FramesAtlas } from '@/ui/closeup/framesAtlas'
import type { CloseupLayout } from '@/ui/closeup/layout'
import { CuedSprite } from '@/ui/closeup/CueRing'
import { place } from '@/ui/closeup/spriteStyle'
import { useSwipe } from '@/ui/closeup/useSwipe'
import { sceneFontSize } from '../bookshelf/skills'
import { CertificateText, PdfLink } from './AwardDetail'
import type { FramesModel } from './model'

type CssVars = CSSProperties & Record<`--${string}`, string>

const HEADING_ID = 'frames-award-title'

// Ilustração dos quadros em escala inteira cobrindo a janela (regra cover): camadas do atlas na
// ordem da spec, texto do certificado no DOM sobre o papel (cada parte no seu rect), setas e miniaturas como botões.
// Ordem de Tab: Fechar → certificado → Abrir PDF → setas → miniaturas.
export function FramesScene({ model, atlas, layout }: { model: FramesModel; atlas: FramesAtlas; layout: CloseupLayout }) {
  const { t } = useTranslation()
  const [hoverThumb, setHoverThumb] = useState<number | null>(null)
  const [focusThumb, setFocusThumb] = useState<number | null>(null)
  const [hoverArrow, setHoverArrow] = useState<ArrowDir | null>(null)
  const [focusArrow, setFocusArrow] = useState<ArrowDir | null>(null)
  const certRef = useRef<HTMLDivElement>(null)

  const { awards, open } = model
  const total = awards.length
  const cur = awards[open]
  const s = layout.scale
  const origin = { x: layout.crop.x, y: layout.crop.y }
  const nThumbs = thumbCount(atlas, total)

  const layers = composeFrames(atlas, {
    count: total,
    open,
    night: model.night,
    hotThumb: hoverThumb ?? focusThumb,
    hotArrow: hoverArrow ?? focusArrow,
  })

  // Foco inicial na área do certificado.
  useEffect(() => {
    certRef.current?.focus()
  }, [])

  const swipe = useSwipe(model.step)

  const viewStyle: CssVars = {
    ...place(layout.crop, s, origin),
    left: layout.view.x,
    top: layout.view.y,
    fontSize: sceneFontSize(s),
    '--px': `${s}px`,
    '--ink-title': atlas.textInk.title,
    '--ink-body': atlas.textInk.body,
    '--ink-counter': atlas.textInk.counter,
    '--ink-kicker': atlas.textInk.kicker,
  }
  const paper = atlas.paper.rect
  const paperOrigin = { x: paper.x, y: paper.y }

  const onCertKey = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      model.step(e.key === 'ArrowLeft' ? -1 : 1)
    }
  }
  const position = t('frames.awardOf', { current: open + 1, total: Math.max(total, 1) })

  return (
    <div className="frames">
      <h2 id={model.titleId} className="visually-hidden">
        {t('frames.title')}
      </h2>
      <button type="button" className="pixel-btn shelf__close" onClick={model.onClose}>
        {t('hud.close')}
      </button>
      <div className="frames__view" style={viewStyle} {...swipe}>
        {layers.map((l) => (
          <CuedSprite
            key={l.key}
            atlas={atlas}
            frame={l.frame}
            s={s}
            crop={layout.crop}
            dx={l.dx}
            dy={l.dy}
            bleed={layout.bleed}
            cue={l.cue}
            hot={l.hot}
            ringOnly={l.ringOnly}
          />
        ))}

        <div
          ref={certRef}
          role="group"
          aria-label={cur ? `${cur.title}. ${position}` : t('frames.title')}
          tabIndex={0}
          className="frames__content"
          style={place(paper, s, origin)}
          onKeyDown={onCertKey}
        >
          {cur ? (
            <CertificateText award={cur} headingId={HEADING_ID} atlas={atlas} s={s} origin={paperOrigin} />
          ) : (
            <p className="cert__desc award__empty" style={place(atlas.text.title, s, paperOrigin)}>
              {t('frames.empty')}
            </p>
          )}
        </div>

        {cur && <PdfLink award={cur} className="frames__pdf" style={place(atlas.pdf, s, origin)} />}

        {total > 0 && (
          <span className="frames__counter" aria-hidden="true" style={place(atlas.counter.text, s, origin)}>
            {open + 1} / {total}
          </span>
        )}

        {total > 1 &&
          (['prev', 'next'] as const).map((dir) => {
            const enabled = canStep(open, dir, total)
            return (
              <button
                key={dir}
                type="button"
                className="frames__hit frames__arrow"
                style={place(atlas.arrows[dir].rect, s, origin)}
                aria-label={dir === 'prev' ? t('frames.prev') : t('frames.next')}
                aria-disabled={!enabled}
                onClick={() => model.step(dir === 'prev' ? -1 : 1)}
                onMouseEnter={() => setHoverArrow(dir)}
                onMouseLeave={() => setHoverArrow((a) => (a === dir ? null : a))}
                onFocus={() => setFocusArrow(dir)}
                onBlur={() => setFocusArrow((a) => (a === dir ? null : a))}
              />
            )
          })}

        {nThumbs > 0 && (
          <div role="group" aria-label={t('frames.thumbsLabel')} className="frames__thumbs">
            {awards.slice(0, nThumbs).map((a, j) => (
              <button
                key={a.id}
                type="button"
                className="frames__hit frames__thumb"
                style={place(atlas.thumbs.rects[j], s, origin)}
                aria-label={a.title}
                aria-current={j === open ? 'true' : undefined}
                onClick={() => model.goTo(j)}
                onMouseEnter={() => setHoverThumb(j)}
                onMouseLeave={() => setHoverThumb((h) => (h === j ? null : h))}
                onFocus={() => setFocusThumb(j)}
                onBlur={() => setFocusThumb((f) => (f === j ? null : f))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
