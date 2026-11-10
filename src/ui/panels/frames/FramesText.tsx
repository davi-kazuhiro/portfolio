import { useRef, type CSSProperties, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSwipe } from '@/ui/closeup/useSwipe'
import { tabKeyTarget } from '../journal/experience'
import { AwardDetail, PdfLink } from './AwardDetail'
import type { FramesModel } from './model'

type CssVars = CSSProperties & Record<`--${string}`, string>

// Modo texto (sem ilustração): telas onde a escala 3 não cabe. Papel em tela cheia com abas dos
// certificados (emissor e ano), o detalhe, o PDF e a paginação. Ordem de Tab = Fechar → abas →
// certificado → Abrir PDF → anterior/próximo.
export function FramesText({ model }: { model: FramesModel }) {
  const { t } = useTranslation()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const { awards, open, atlas } = model
  const total = awards.length
  const cur = awards[open]
  const swipe = useSwipe(model.step)

  const onTabKey = (e: KeyboardEvent, j: number) => {
    const next = tabKeyTarget(e.key, j, total)
    if (next === null) return
    e.preventDefault()
    model.goTo(next)
    tabRefs.current[next]?.focus()
  }
  const onPanelKey = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      model.step(e.key === 'ArrowLeft' ? -1 : 1)
    }
  }
  const style: CssVars | undefined = atlas
    ? { background: atlas.panelBackground, '--ink-title': atlas.textInk.title, '--ink-body': atlas.textInk.body }
    : undefined

  return (
    <div className="shelf-text frames-text" style={style}>
      <header className="shelf-text__header">
        <h2 id={model.titleId}>{t('frames.title')}</h2>
        <button type="button" className="pixel-btn" onClick={model.onClose}>
          {t('hud.close')}
        </button>
      </header>
      {total > 0 && (
        <div role="tablist" aria-label={t('frames.thumbsLabel')} className="shelf-text__nav">
          {awards.map((a, j) => {
            const year = a.date.slice(0, 4)
            return (
              <button
                key={a.id}
                ref={(el) => {
                  tabRefs.current[j] = el
                }}
                type="button"
                role="tab"
                id={`frames-tab-${j}`}
                aria-selected={j === open}
                aria-controls="frames-award"
                aria-label={t('frames.tabAria', { issuer: a.issuer, year, title: a.title })}
                tabIndex={j === open ? 0 : -1}
                className="shelf-text__tab frames-text__tab"
                onClick={() => model.goTo(j)}
                onKeyDown={(ev) => onTabKey(ev, j)}
              >
                {a.issuer} {year}
              </button>
            )
          })}
        </div>
      )}
      <div className="shelf-text__body">
        {cur ? (
          <section
            id="frames-award"
            role="tabpanel"
            aria-labelledby={`frames-tab-${open}`}
            tabIndex={0}
            className="shelf-text__section frames-text__panel"
            onKeyDown={onPanelKey}
            {...swipe}
          >
            <AwardDetail award={cur} headingId="frames-award-title" />
            <PdfLink award={cur} className="pixel-btn frames-text__pdf" />
            {total > 1 && (
              <div className="shelf-text__pager">
                <button type="button" className="pixel-btn" aria-disabled={open === 0} onClick={() => model.step(-1)}>
                  <span aria-hidden="true">‹ </span>
                  {t('frames.prev')}
                </button>
                <span>{t('frames.awardOf', { current: open + 1, total })}</span>
                <button type="button" className="pixel-btn" aria-disabled={open === total - 1} onClick={() => model.step(1)}>
                  {t('frames.next')}
                  <span aria-hidden="true"> ›</span>
                </button>
              </div>
            )}
          </section>
        ) : (
          <p className="award__empty">{t('frames.empty')}</p>
        )}
      </div>
    </div>
  )
}
