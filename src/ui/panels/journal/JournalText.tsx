import { useRef, type CSSProperties, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSwipe } from '@/ui/closeup/useSwipe'
import { isCurrent, tabKeyTarget } from './experience'
import type { JournalModel } from './model'
import { tabAriaLabel } from './labels'
import { Checklist, EducationSide, ExperienceHead } from './pages'

type CssVars = CSSProperties & Record<`--${string}`, string>

/** Escala dos ícones e das caixinhas no modo texto (7×7 → 14 px). */
const ICON_K = 2

// Modo texto (sem ilustração): telas onde a escala 3 não cabe. Papel em tela cheia com as
// mesmas informações; ordem de Tab = Fechar → abas → experiência → anterior/próxima.
export function JournalText({ model }: { model: JournalModel }) {
  const { t } = useTranslation()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const { pages, page, atlas } = model
  const total = pages.length
  const cur = pages[page]
  const swipe = useSwipe(model.turn)

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
      model.turn(e.key === 'ArrowLeft' ? -1 : 1)
    }
  }
  const pageLabel = t('journal.pageOf', { current: page + 1, total: Math.max(total, 1) })
  const ink = (cur && atlas?.types[cur.type]?.ink) || undefined

  return (
    <div
      className="shelf-text journal-text"
      style={{
        ...(atlas ? { background: atlas.panelBackground, '--ink-title': atlas.textInk.title, '--ink-body': atlas.textInk.body } : {}),
        ...(ink ? { '--ink-type': ink } : {}),
      }}
    >
      <header className="shelf-text__header">
        <h2 id={model.titleId}>{t('journal.title')}</h2>
        <button type="button" className="pixel-btn" onClick={model.onClose}>
          {t('hud.close')}
        </button>
      </header>
      {total > 0 && (
        <div role="tablist" aria-label={t('journal.tabsLabel')} className="shelf-text__nav journal-text__tabs">
          {pages.map((p, j) => (
            <button
              key={p.id}
              ref={(el) => {
                tabRefs.current[j] = el
              }}
              type="button"
              role="tab"
              id={`journal-tab-${j}`}
              aria-selected={j === page}
              aria-controls="journal-spread"
              aria-label={tabAriaLabel(t, p)}
              tabIndex={j === page ? 0 : -1}
              className={`shelf-text__tab journal-text__tab journal-text__tab--${p.type}`}
              style={atlas?.types[p.type] ? ({ '--tab': atlas.types[p.type].tab } as CssVars) : undefined}
              onClick={() => model.goTo(j)}
              onKeyDown={(ev) => onTabKey(ev, j)}
            >
              <span className="journal-text__swatch" aria-hidden="true" />
              {t(`journal.type.${p.type}`)}
            </button>
          ))}
        </div>
      )}
      <div className="shelf-text__body">
        {cur ? (
          <section
            id="journal-spread"
            role="tabpanel"
            aria-labelledby={`journal-tab-${page}`}
            tabIndex={0}
            className="shelf-text__section journal-text__panel"
            onKeyDown={onPanelKey}
            {...swipe}
          >
            {cur.kind === 'experience' ? (
              <>
                <ExperienceHead exp={cur.exp} current={isCurrent(cur.exp, model.now)} atlas={atlas} k={ICON_K} />
                <Checklist exp={cur.exp} atlas={atlas} k={ICON_K} labelId="journal-checklist" />
              </>
            ) : (
              cur.items.map((ed) => <EducationSide key={ed.id} ed={ed} atlas={atlas} k={ICON_K} />)
            )}
            {total > 1 && (
              <div className="shelf-text__pager">
                <button type="button" className="pixel-btn" aria-disabled={page === 0} onClick={() => model.turn(-1)}>
                  <span aria-hidden="true">‹ </span>
                  {t('journal.prevPage')}
                </button>
                <span>{pageLabel}</span>
                <button type="button" className="pixel-btn" aria-disabled={page === total - 1} onClick={() => model.turn(1)}>
                  {t('journal.nextPage')}
                  <span aria-hidden="true"> ›</span>
                </button>
              </div>
            )}
          </section>
        ) : (
          <p className="journal-head__empty">{t('journal.empty')}</p>
        )}
      </div>
    </div>
  )
}
