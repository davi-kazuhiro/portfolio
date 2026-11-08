import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { unionRect as union, type CloseupLayout } from '@/ui/closeup/layout'
import { composeShelf, shelfButtons, type ShelfAtlas, type ShelfItem } from '@/ui/closeup/shelfAtlas'
import type { HighlightRef, ShelfModel } from './model'
import { LanguagePage, SpokenPage, TocPage, ToolsList } from './pages'
import { clampIndex, languagePageCount, projectsUsing, sceneFontSize, spreadCount, spreadOf } from './skills'
import { SceneSprite } from './Sprite'
import { place } from './spriteStyle'
import { useSwipe } from './useSwipe'

type CssVars = CSSProperties & Record<`--${string}`, string>

function useItemLabel(model: ShelfModel) {
  const { t } = useTranslation()
  return (item: ShelfItem) => {
    if (item.id === 'languages') return t('bookshelf.openLanguages')
    if (item.id === 'spoken-languages') return t('bookshelf.openSpokenLanguages')
    if (item.id === 'tools') return t('bookshelf.openTools')
    return t('bookshelf.openHobby', { name: model.hobbyName(item.id) })
  }
}

// Ilustração da prateleira em escala inteira cobrindo a janela (regra cover): camadas do atlas na
// ordem da spec, sangria nas bordas, botões sobre o `hit` de cada item e o destaque aberto com o
// texto no DOM.
export function ShelfScene({
  model,
  atlas,
  layout,
  focusTarget,
}: {
  model: ShelfModel
  atlas: ShelfAtlas
  layout: CloseupLayout
  focusTarget: HighlightRef
}) {
  const { t } = useTranslation()
  const [hover, setHover] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)
  const itemLabel = useItemLabel(model)
  const s = layout.scale
  const origin = { x: layout.crop.x, y: layout.crop.y }
  const hot = [hover, focused].filter((h): h is string => h !== null)
  const layers = composeShelf(atlas, { open: model.open, night: model.night, hot })
  const highlight = atlas.highlights[model.open]

  const viewStyle: CssVars = {
    ...place(layout.crop, s, origin),
    left: layout.view.x,
    top: layout.view.y,
    fontSize: sceneFontSize(s),
    '--px': `${s}px`,
    '--paper': atlas.panelBackground,
  }

  const hotHandlers = (id: string) => ({
    onMouseEnter: () => setHover(id),
    onMouseLeave: () => setHover((h) => (h === id ? null : h)),
    onFocus: () => setFocused(id),
    onBlur: () => setFocused((f) => (f === id ? null : f)),
  })

  return (
    <div
      className="shelf"
      onClick={(e) => {
        if (e.target === e.currentTarget) model.onClose()
      }}
    >
      <h2 id={model.titleId} className="visually-hidden">
        {t('bookshelf.title')}
      </h2>
      <button type="button" className="pixel-btn shelf__close" onClick={model.onClose}>
        {t('hud.close')}
      </button>
      <div className="shelf__view" style={viewStyle}>
        {layers.map((l) => (
          <SceneSprite
            key={l.key}
            atlas={atlas}
            frame={l.frame}
            s={s}
            crop={layout.crop}
            lifted={l.lifted}
            bleed={layout.bleed}
          />
        ))}

        <ul className="shelf__items" aria-label={t('bookshelf.shelfLabel')}>
          {shelfButtons(atlas, model.open).map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`shelf__hit${focused === item.id ? ' shelf__hit--lifted' : ''}`}
                style={place(item.hit!, s, origin)}
                aria-label={itemLabel(item)}
                onClick={() => model.select(item.id)}
                {...hotHandlers(item.id)}
              />
            </li>
          ))}
        </ul>

        {highlight?.layout === 'book' && <SceneBook model={model} atlas={atlas} s={s} origin={origin} focusTarget={focusTarget} />}
        {highlight?.layout === 'tools' && <SceneTools model={model} atlas={atlas} s={s} origin={origin} focusTarget={focusTarget} />}
        {highlight?.layout === 'hobby' && (
          <SceneHobby model={model} atlas={atlas} s={s} origin={origin} focusTarget={focusTarget} hotHandlers={hotHandlers} />
        )}
      </div>
    </div>
  )
}

interface PartProps {
  model: ShelfModel
  atlas: ShelfAtlas
  s: number
  origin: { x: number; y: number }
  focusTarget: HighlightRef
}

function SceneBook({ model, atlas, s, origin, focusTarget }: PartProps) {
  const { t } = useTranslation()
  const L = atlas.layouts.book
  const isLanguages = model.open === 'languages'
  const { languages, spokenLanguages } = model.skills
  const total = isLanguages ? languagePageCount(languages) : spokenLanguages.length
  const spreads = spreadCount(total)
  const page = clampIndex(model.pages[model.open] ?? 0, total)
  const spread = spreadOf(page)
  const title = isLanguages ? t('bookshelf.languages') : t('bookshelf.spokenLanguages')

  const turn = (dir: 1 | -1) => {
    const next = clampIndex(spread + dir, spreads)
    if (next === spread) return
    model.setPage(model.open, next * 2, t('bookshelf.pageOf', { n: next + 1, total: spreads }))
  }
  const jump = (p: number) => {
    const sp = spreadOf(p)
    model.setPage(model.open, p, t('bookshelf.pageOf', { n: sp + 1, total: spreads }), true)
  }
  const swipe = useSwipe(turn)
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      turn(e.key === 'ArrowLeft' ? -1 : 1)
    }
  }

  const iconK = s
  const renderPage = (p: number) => {
    if (p >= total) return null
    if (!isLanguages) return <SpokenPage lang={spokenLanguages[p]} atlas={atlas} iconK={iconK} />
    if (p === 0) return <TocPage languages={languages} onJump={jump} />
    const lang = languages[p - 1]
    return <LanguagePage lang={lang} usedIn={projectsUsing(lang.matches, model.projects)} atlas={atlas} iconK={iconK} />
  }

  const box = L.cover
  const tone = isLanguages ? 'red' : 'blue'
  return (
    <div
      ref={focusTarget}
      className={`shelf__group shelf-book shelf-book--${tone}`}
      role="group"
      aria-label={`${title}. ${t('bookshelf.pageOf', { n: spread + 1, total: spreads })}`}
      tabIndex={0}
      style={place(box, s, origin)}
      onKeyDown={onKeyDown}
      {...swipe}
    >
      {(['left', 'right'] as const).map((side, i) => {
        const p = spread * 2 + i
        return (
          <div key={side} className="shelf-book__page" style={place(L.content[side], s, box)}>
            {renderPage(p)}
            {p < total && (
              <span className="shelf-book__num" aria-hidden="true">
                {p + 1}
              </span>
            )}
          </div>
        )
      })}
      {spreads > 1 &&
        (['prev', 'next'] as const).map((dir) => {
          const disabled = dir === 'prev' ? spread === 0 : spread === spreads - 1
          return (
            <button
              key={dir}
              type="button"
              className="shelf__corner"
              style={place(L.pageTurn[dir], s, box)}
              aria-label={dir === 'prev' ? t('bookshelf.prevPage') : t('bookshelf.nextPage')}
              aria-disabled={disabled}
              onClick={() => turn(dir === 'prev' ? -1 : 1)}
            />
          )
        })}
    </div>
  )
}

function SceneTools({ model, atlas, s, origin, focusTarget }: PartProps) {
  const { t } = useTranslation()
  const L = atlas.layouts.tools
  const box = L.content
  return (
    <section
      ref={focusTarget}
      className="shelf__group shelf-tools"
      aria-labelledby="shelf-tools-title"
      tabIndex={-1}
      style={place(box, s, origin)}
    >
      <h3 id="shelf-tools-title" className="shelf-tools__title" style={{ height: L.titleH * s }}>
        {t('bookshelf.tools')}
      </h3>
      <span className="shelf-tools__rule" aria-hidden="true" style={{ top: L.ruleY * s }} />
      <div
        className="shelf-tools__rows"
        style={
          {
            top: L.firstRowY * s,
            '--row': `${L.rowPitch * s}px`,
            '--row-text-x': `${L.rowTextX * s}px`,
          } as CssVars
        }
      >
        <ToolsList tools={model.skills.tools} atlas={atlas} iconK={s} />
      </div>
    </section>
  )
}

function SceneHobby({
  model,
  focusTarget,
  atlas,
  s,
  origin,
  hotHandlers,
}: PartProps & { hotHandlers: (id: string) => Record<string, () => void> }) {
  const { t } = useTranslation()
  const L = atlas.layouts.hobby
  const box = union(L.stage, L.arrows.prev.rect, L.arrows.next.rect)
  const n = model.hobbyCycle.indexOf(model.open) + 1
  const label = t('bookshelf.hobbyOf', { name: model.hobbyName(model.open), n, total: model.hobbyCycle.length })
  const swipe = useSwipe(model.stepHobby)
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      model.stepHobby(e.key === 'ArrowLeft' ? -1 : 1)
    }
  }
  return (
    <div className="shelf-hobby" role="group" aria-label={t('bookshelf.hobbies')} style={place(box, s, origin)} onKeyDown={onKeyDown}>
      <div
        ref={focusTarget}
        className="shelf__group shelf-hobby__stage"
        role="img"
        aria-label={label}
        tabIndex={0}
        style={place(L.stage, s, box)}
        {...swipe}
      />
      {(['prev', 'next'] as const).map((dir) => (
        <button
          key={dir}
          type="button"
          className="shelf__arrow"
          style={place(L.arrows[dir].rect, s, box)}
          aria-label={dir === 'prev' ? t('bookshelf.prevHobby') : t('bookshelf.nextHobby')}
          onClick={() => model.stepHobby(dir === 'prev' ? -1 : 1)}
          {...hotHandlers(`arrow:${dir}`)}
        />
      ))}
    </div>
  )
}
