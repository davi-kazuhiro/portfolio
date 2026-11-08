import type { KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { HighlightRef, ShelfModel } from './model'
import { LanguagePage, SpokenPage, TocPage, ToolsList } from './pages'
import { clampIndex, languagePageCount, projectsUsing } from './skills'
import { FrameImage } from './Sprite'
import { useSwipe } from './useSwipe'

type Section = 'languages' | 'spoken-languages' | 'tools' | 'hobbies'

const sectionOf = (open: string): Section =>
  open === 'languages' || open === 'spoken-languages' || open === 'tools' ? open : 'hobbies'

// Modo texto (sem ilustração em cena): telas onde a escala 3 não cabe. Papel em tela cheia com
// as mesmas seções da prateleira; Linguagens página a página, hobby com o objeto ampliado a 2×.
export function ShelfText({ model, focusTarget }: { model: ShelfModel; focusTarget: HighlightRef }) {
  const { t } = useTranslation()
  const section = sectionOf(model.open)
  const sections: { id: Section; label: string }[] = [
    { id: 'languages', label: t('bookshelf.languages') },
    { id: 'spoken-languages', label: t('bookshelf.spokenLanguages') },
    { id: 'tools', label: t('bookshelf.tools') },
    { id: 'hobbies', label: t('bookshelf.hobbies') },
  ]

  return (
    <div className="shelf-text" style={model.atlas ? { background: model.atlas.panelBackground } : undefined}>
      <header className="shelf-text__header">
        <h2 id={model.titleId}>{t('bookshelf.title')}</h2>
        <button type="button" className="pixel-btn" onClick={model.onClose}>
          {t('hud.close')}
        </button>
      </header>
      <nav className="shelf-text__nav" aria-label={t('bookshelf.sections')}>
        {sections.map((sec) => (
          <button
            key={sec.id}
            type="button"
            className="shelf-text__tab"
            aria-pressed={section === sec.id}
            onClick={() => model.select(sec.id === 'hobbies' ? (model.hobbyCycle[0] ?? 'hobbies') : sec.id)}
          >
            {sec.label}
          </button>
        ))}
      </nav>
      <div className="shelf-text__body">
        {section === 'languages' && <TextLanguages model={model} focusTarget={focusTarget} />}
        {section === 'spoken-languages' && (
          <section ref={focusTarget} tabIndex={-1} aria-label={t('bookshelf.spokenLanguages')} className="shelf-text__section">
            {model.skills.spokenLanguages.map((lang) => (
              <SpokenPage key={lang.id} lang={lang} atlas={model.atlas} iconK={3} />
            ))}
          </section>
        )}
        {section === 'tools' && (
          <section ref={focusTarget} tabIndex={-1} aria-labelledby="shelf-tools-title" className="shelf-text__section">
            <h3 id="shelf-tools-title" className="book-page__title">
              {t('bookshelf.tools')}
            </h3>
            <ToolsList tools={model.skills.tools} atlas={model.atlas} iconK={3} />
          </section>
        )}
        {section === 'hobbies' && <TextHobby model={model} focusTarget={focusTarget} />}
      </div>
    </div>
  )
}

function TextLanguages({ model, focusTarget }: { model: ShelfModel; focusTarget: HighlightRef }) {
  const { t } = useTranslation()
  const { languages } = model.skills
  const total = languagePageCount(languages)
  const page = clampIndex(model.pages.languages ?? 0, total)
  const go = (p: number, refocus = false) => {
    const next = clampIndex(p, total)
    if (next !== page) model.setPage('languages', next, t('bookshelf.pageOf', { n: next + 1, total }), refocus)
  }
  const swipe = useSwipe((dir) => go(page + dir))
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      go(page + (e.key === 'ArrowLeft' ? -1 : 1))
    }
  }
  const lang = page > 0 ? languages[page - 1] : null
  return (
    <section
      ref={focusTarget}
      tabIndex={0}
      role="group"
      aria-label={`${t('bookshelf.languages')}. ${t('bookshelf.pageOf', { n: page + 1, total })}`}
      className="shelf-text__section shelf-text__book"
      onKeyDown={onKeyDown}
      {...swipe}
    >
      {lang ? (
        <LanguagePage lang={lang} usedIn={projectsUsing(lang.matches, model.projects)} atlas={model.atlas} iconK={3} />
      ) : (
        <TocPage languages={languages} onJump={(p) => go(p, true)} />
      )}
      <div className="shelf-text__pager">
        <button type="button" className="pixel-btn" aria-disabled={page === 0} onClick={() => go(page - 1)}>
          <span aria-hidden="true">‹ </span>
          {t('bookshelf.prevPage')}
        </button>
        <span>{t('bookshelf.pageOf', { n: page + 1, total })}</span>
        <button type="button" className="pixel-btn" aria-disabled={page === total - 1} onClick={() => go(page + 1)}>
          {t('bookshelf.nextPage')}
          <span aria-hidden="true"> ›</span>
        </button>
      </div>
    </section>
  )
}

function TextHobby({ model, focusTarget }: { model: ShelfModel; focusTarget: HighlightRef }) {
  const { t } = useTranslation()
  const n = model.hobbyCycle.indexOf(model.open) + 1
  const name = model.hobbyName(model.open)
  const frame = model.atlas?.highlights[model.open]?.parts[0]?.frame
  const swipe = useSwipe(model.stepHobby)
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      model.stepHobby(e.key === 'ArrowLeft' ? -1 : 1)
    }
  }
  return (
    <section
      ref={focusTarget}
      tabIndex={0}
      role="group"
      aria-label={t('bookshelf.hobbyOf', { name, n, total: model.hobbyCycle.length })}
      className="shelf-text__section shelf-text__hobby"
      onKeyDown={onKeyDown}
      {...swipe}
    >
      <h3 className="book-page__title">{name}</h3>
      <div className="shelf-text__stage">{model.atlas && frame && <FrameImage atlas={model.atlas} frame={frame} k={2} />}</div>
      <div className="shelf-text__pager">
        <button type="button" className="pixel-btn" onClick={() => model.stepHobby(-1)}>
          <span aria-hidden="true">‹ </span>
          {t('bookshelf.prevHobby')}
        </button>
        <span>
          {n} / {model.hobbyCycle.length}
        </span>
        <button type="button" className="pixel-btn" onClick={() => model.stepHobby(1)}>
          {t('bookshelf.nextHobby')}
          <span aria-hidden="true"> ›</span>
        </button>
      </div>
    </section>
  )
}
