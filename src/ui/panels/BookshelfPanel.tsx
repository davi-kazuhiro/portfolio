import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getContent } from '@/content'
import { useViewportSize } from '@/ui/closeup/hooks'
import { HUD_BAND, pickCloseupLayout } from '@/ui/closeup/layout'
import { useNightAtOpen } from '@/ui/closeup/useNightAtOpen'
import { shelfGeometry } from '@/ui/closeup/shelfAtlas'
import { useShelfAtlas } from '@/ui/closeup/useShelfAtlas'
import type { ShelfModel } from './bookshelf/model'
import { ShelfScene } from './bookshelf/ShelfScene'
import { ShelfText } from './bookshelf/ShelfText'
import { cycleStep, type Skills } from './bookshelf/skills'
import { toLocale } from './locale'
import type { PanelProps } from './types'

// Estante → Habilidades (specs.md §4). Visão de perto da prateleira: a ilustração inteira é o
// painel (itens da tábua são botões; o item aberto aparece embaixo, como livro, cartão ou objeto
// ampliado). A ilustração cobre a janela inteira (regra cover); quando nenhuma escala ≥ 3 cabe
// (celular, tablet em retrato), modo texto em tela cheia com a mesma informação.
export function BookshelfPanel({ titleId, onClose }: PanelProps) {
  const { t, i18n } = useTranslation()
  const content = getContent(toLocale(i18n.language))
  const skills = content.skills as Skills
  const projects = content.projects as ShelfModel['projects']

  const atlasState = useShelfAtlas()
  const atlas = atlasState.status === 'ready' ? atlasState.atlas : null
  const vp = useViewportSize()
  const night = useNightAtOpen()

  const [open, setOpen] = useState<string>(() => atlas?.defaultOpen ?? 'languages')
  const [pages, setPages] = useState<Record<string, number>>({})
  const [message, setMessage] = useState('')

  // Mesma regra da visão de perto do computador (cover, layout.ts): a ilustração cobre a janela
  // em escala inteira ≥ minScale (3), com os destaques e a base dos itens fora da faixa do HUD;
  // sem escala possível (celular, tablet em retrato), modo texto em tela cheia.
  const geometry = useMemo(() => (atlas ? shelfGeometry(atlas) : null), [atlas])
  const layout = geometry ? pickCloseupLayout(vp.w, vp.h, geometry, HUD_BAND) : null
  const sceneMode = layout !== null && layout.mode === 'cover'

  // Foco no destaque a cada troca de item (o botão clicado some da tábua) e ao pular pelo
  // sumário (a linha clicada desmonta). Na abertura: na cena, o livro; no modo texto, o foco
  // fica no diálogo, e o Tab segue a ordem visual (Fechar → seções → conteúdo).
  const highlightEl = useRef<HTMLElement | null>(null)
  const wantFocus = useRef(true)
  const firstFocus = useRef(true)
  const setHighlight = useCallback((el: HTMLElement | null) => {
    highlightEl.current = el
  }, [])
  useEffect(() => {
    if (!wantFocus.current || !highlightEl.current) return
    wantFocus.current = false
    const initial = firstFocus.current
    firstFocus.current = false
    if (initial && !sceneMode) return
    highlightEl.current.focus()
  })

  const hobbyCycle = useMemo(() => {
    const ids = skills.hobbies.map((h) => h.id)
    const cycle = atlas?.layouts.hobby.cycle.filter((id) => ids.includes(id)) ?? []
    return cycle.length > 0 ? cycle : ids
  }, [atlas, skills.hobbies])

  const hobbyName = useCallback((id: string) => skills.hobbies.find((h) => h.id === id)?.name ?? id, [skills.hobbies])

  const select = useCallback((id: string) => {
    wantFocus.current = true
    setOpen(id)
  }, [])

  const stepHobby = useCallback(
    (dir: 1 | -1) => {
      const next = cycleStep(hobbyCycle, open, dir)
      setOpen(next)
      setMessage(t('bookshelf.hobbyOf', { name: hobbyName(next), n: hobbyCycle.indexOf(next) + 1, total: hobbyCycle.length }))
    },
    [hobbyCycle, open, hobbyName, t],
  )

  const setPage = useCallback((book: string, page: number, announce: string, refocus = false) => {
    if (refocus) wantFocus.current = true
    setPages((p) => ({ ...p, [book]: page }))
    setMessage(announce)
  }, [])

  if (atlasState.status === 'loading') {
    return (
      <div className="panel shelf-loading" role="status">
        <h2 id={titleId}>{t('objects.bookshelf')}</h2>
        <p>{t('panel.loading')}</p>
      </div>
    )
  }

  const model: ShelfModel = {
    atlas,
    night,
    skills,
    projects,
    open,
    select,
    pages,
    setPage,
    hobbyCycle,
    stepHobby,
    hobbyName,
    titleId,
    onClose,
  }


  return (
    <>
      {sceneMode && layout && atlas ? (
        <ShelfScene model={model} atlas={atlas} layout={layout} focusTarget={setHighlight} />
      ) : (
        <ShelfText model={model} focusTarget={setHighlight} />
      )}
      <div className="visually-hidden" aria-live="polite">
        {message}
      </div>
    </>
  )
}
