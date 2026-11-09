import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { composeJournal, tabArt, type JournalAtlas } from '@/ui/closeup/journalAtlas'
import type { CloseupLayout, Rect } from '@/ui/closeup/layout'
import { SceneSprite } from '@/ui/closeup/SceneSprite'
import { place } from '@/ui/closeup/spriteStyle'
import { useSwipe } from '@/ui/closeup/useSwipe'
import { sceneFontSize } from '../bookshelf/skills'
import { isCurrent, tabKeyTarget } from './experience'
import type { JournalModel } from './model'
import { Checklist, ExperienceHead } from './pages'

type CssVars = CSSProperties & Record<`--${string}`, string>

/** Alvo mínimo dos cantos (px de arte): a 3× dá 45 px CSS, acima dos 44 px de toque. */
const CORNER_HIT = 15

/** Rect do canto aumentado para dentro da página (para cima e para o lado da dobra). */
function cornerHit(r: Rect, dir: 'prev' | 'next'): Rect {
  const grow = Math.max(0, CORNER_HIT - r.w)
  const growY = Math.max(0, CORNER_HIT - r.h)
  return { x: dir === 'prev' ? r.x : r.x - grow, y: r.y - growY, w: r.w + grow, h: r.h + growY }
}

/** Marca o elemento como focável (tabIndex 0) só quando ele tem rolagem. */
function useScrollable<T extends HTMLElement>(deps: unknown) {
  const ref = useRef<T>(null)
  const [scrolls, setScrolls] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setScrolls(el.scrollHeight > el.clientHeight + 1)
    check()
    el.scrollTop = 0
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [deps])
  return [ref, scrolls] as const
}

// Ilustração do caderno em escala inteira cobrindo a janela (regra cover): camadas do atlas na
// ordem da spec (§5), abas como tablist, a página dupla como tabpanel com o texto no DOM
// alinhado à pauta, cantos que viram a página.
export function JournalScene({ model, atlas, layout }: { model: JournalModel; atlas: JournalAtlas; layout: CloseupLayout }) {
  const { t } = useTranslation()
  const [hoverTab, setHoverTab] = useState<number | null>(null)
  const [focusTab, setFocusTab] = useState<number | null>(null)
  const [hotCorner, setHotCorner] = useState<'prev' | 'next' | null>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const spreadRef = useRef<HTMLDivElement>(null)

  const { experiences, page } = model
  const total = experiences.length
  const exp = experiences[page]
  const s = layout.scale
  const origin = { x: layout.crop.x, y: layout.crop.y }
  const types = experiences.map((e) => e.type)
  const nTabs = Math.min(total, atlas.tabs.slots)

  const canTurn = (dir: 'prev' | 'next') => (dir === 'prev' ? page > 0 : page < total - 1)
  const layers = composeJournal(atlas, {
    types,
    open: page,
    night: model.night,
    hotTab: hoverTab ?? focusTab,
    hotCorner: hotCorner && canTurn(hotCorner) ? hotCorner : null,
  })

  // Foco inicial na página dupla (o Tab volta para Fechar e as abas).
  useEffect(() => {
    spreadRef.current?.focus()
  }, [])

  const swipe = useSwipe(model.turn)
  const [rightRef, rightScrolls] = useScrollable<HTMLDivElement>(`${page}:${s}:${exp?.id}`)

  const pitch = atlas.ruling.pitch
  const line = pitch * s
  const book = atlas.book.rect
  const viewStyle: CssVars = {
    ...place(layout.crop, s, origin),
    left: layout.view.x,
    top: layout.view.y,
    fontSize: sceneFontSize(s),
    '--px': `${s}px`,
    '--line': `${line}px`,
    '--text-x': `${atlas.checklist.textX * s}px`,
    '--check-top': `${atlas.checklist.at.y * s}px`,
    '--ink-title': atlas.textInk.title,
    '--ink-body': atlas.textInk.body,
    '--ink-type': (exp && atlas.types[exp.type]?.ink) || atlas.textInk.body,
  }
  // Primeira linha no topo do conteúdo (= caixa da linha 0 da pauta). Na esquerda, o texto para
  // nas linhas acima do carimbo.
  const left = atlas.content.left
  const right = atlas.content.right
  const freeLines = Math.max(1, Math.floor((atlas.stamp.rect.y - left.y) / pitch))
  const leftStyle = { ...place({ ...left, h: freeLines * pitch }, s, book) }

  const onSpreadKey = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      model.turn(e.key === 'ArrowLeft' ? -1 : 1)
    }
  }
  const onTabKey = (e: KeyboardEvent, j: number) => {
    const next = tabKeyTarget(e.key, j, nTabs)
    if (next === null) return
    e.preventDefault()
    model.goTo(next)
    tabRefs.current[next]?.focus()
  }
  const pageLabel = t('journal.pageOf', { current: page + 1, total: Math.max(total, 1) })

  return (
    <div className="journal">
      <h2 id={model.titleId} className="visually-hidden">
        {t('journal.title')}
      </h2>
      <button type="button" className="pixel-btn shelf__close" onClick={model.onClose}>
        {t('hud.close')}
      </button>
      <div className="journal__view" style={viewStyle}>
        {layers.map((l) => (
          <SceneSprite key={l.key} atlas={atlas} frame={l.frame} s={s} crop={layout.crop} dy={l.dy} bleed={layout.bleed} />
        ))}

        {nTabs > 0 && (
          <div role="tablist" aria-label={t('journal.tabsLabel')} aria-orientation="vertical" className="journal__tabs">
            {experiences.slice(0, nTabs).map((e, j) => {
              const art = tabArt(atlas, j, page, e.type)
              if (!art) return null
              return (
                <button
                  key={e.id}
                  ref={(el) => {
                    tabRefs.current[j] = el
                  }}
                  type="button"
                  role="tab"
                  id={`journal-tab-${j}`}
                  aria-selected={j === page}
                  aria-controls="journal-spread"
                  aria-label={t('journal.tabAria', { type: t(`journal.type.${e.type}`), title: e.title, organization: e.organization })}
                  tabIndex={j === page ? 0 : -1}
                  className="journal__tab"
                  style={place(art.rect, s, origin)}
                  onClick={() => model.goTo(j)}
                  onKeyDown={(ev) => onTabKey(ev, j)}
                  onMouseEnter={() => setHoverTab(j)}
                  onMouseLeave={() => setHoverTab((h) => (h === j ? null : h))}
                  onFocus={() => setFocusTab(j)}
                  onBlur={() => setFocusTab((f) => (f === j ? null : f))}
                />
              )
            })}
          </div>
        )}

        <div
          ref={spreadRef}
          id="journal-spread"
          role={nTabs > 0 ? 'tabpanel' : 'group'}
          aria-label={exp ? `${exp.title}. ${pageLabel}` : t('journal.title')}
          tabIndex={0}
          className="journal__spread"
          style={place(book, s, origin)}
          onKeyDown={onSpreadKey}
          {...swipe}
        >
          {exp ? (
            <>
              <div className="journal__page" style={leftStyle}>
                <ExperienceHead exp={exp} current={isCurrent(exp, model.now)} atlas={atlas} k={s} />
              </div>
              <span
                role="img"
                className="journal__stamp"
                aria-label={t('journal.stampAria', { type: t(`journal.type.${exp.type}`) })}
                style={place(atlas.stamp.rect, s, book)}
              />
              <div
                ref={rightRef}
                className="journal__page journal__page--right"
                style={place(right, s, book)}
                tabIndex={rightScrolls ? 0 : undefined}
                role={rightScrolls ? 'region' : undefined}
                aria-label={rightScrolls ? t('journal.checklistLabel') : undefined}
              >
                <Checklist exp={exp} atlas={atlas} k={s} labelId="journal-checklist" />
              </div>
            </>
          ) : (
            <div className="journal__page" style={place(left, s, book)}>
              <p className="journal-head__empty">{t('journal.empty')}</p>
            </div>
          )}

          {total > 1 &&
            (['prev', 'next'] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                className="journal__corner"
                style={place(cornerHit(atlas.pageTurn[dir].rect, dir), s, book)}
                aria-label={dir === 'prev' ? t('journal.prevPage') : t('journal.nextPage')}
                aria-disabled={!canTurn(dir)}
                onClick={() => model.turn(dir === 'prev' ? -1 : 1)}
                onMouseEnter={() => setHotCorner(dir)}
                onMouseLeave={() => setHotCorner((c) => (c === dir ? null : c))}
                onFocus={() => setHotCorner(dir)}
                onBlur={() => setHotCorner((c) => (c === dir ? null : c))}
              />
            ))}
        </div>
      </div>
    </div>
  )
}
