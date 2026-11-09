import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getContent } from '@/content'
import { useViewportSize } from '@/ui/closeup/hooks'
import { journalGeometry } from '@/ui/closeup/journalAtlas'
import { HUD_BAND, pickCloseupLayout } from '@/ui/closeup/layout'
import { useJournalAtlas } from '@/ui/closeup/useJournalAtlas'
import { useNightAtOpen } from '@/ui/closeup/useNightAtOpen'
import { turnPage } from './journal/experience'
import { JournalScene } from './journal/JournalScene'
import { JournalText } from './journal/JournalText'
import type { JournalModel } from './journal/model'
import { toLocale } from './locale'
import type { PanelProps } from './types'

// Caderno → Experiência (specs.md §5). Visão de perto em tela cheia: caderno aberto na mesa,
// uma experiência por página dupla, abas por experiência. A ilustração cobre a janela (regra
// cover); sem escala ≥ 3 possível (celular, tablet em retrato), modo texto em tela cheia.
export function JournalPanel({ titleId, onClose }: PanelProps) {
  const { t, i18n } = useTranslation()
  const experiences = getContent(toLocale(i18n.language)).experiences

  const atlasState = useJournalAtlas()
  const atlas = atlasState.status === 'ready' ? atlasState.atlas : null
  const vp = useViewportSize()
  const night = useNightAtOpen()
  // "Atual" é calculado com a data da abertura.
  const [now] = useState(() => new Date())

  const [rawPage, setPage] = useState(0)
  const [message, setMessage] = useState('')
  const total = experiences.length
  const page = Math.min(rawPage, Math.max(total - 1, 0))

  const geometry = useMemo(() => (atlas ? journalGeometry(atlas) : null), [atlas])
  const layout = geometry ? pickCloseupLayout(vp.w, vp.h, geometry, HUD_BAND) : null
  const sceneMode = layout !== null && layout.mode === 'cover'

  const goTo = useCallback(
    (i: number) => {
      const next = Math.min(Math.max(i, 0), Math.max(total - 1, 0))
      setPage(next)
      setMessage(t('journal.pageOf', { current: next + 1, total }))
    },
    [t, total],
  )
  const turn = useCallback(
    (dir: 1 | -1) => {
      const next = turnPage(page, dir, total)
      if (next !== page) goTo(next)
    },
    [page, total, goTo],
  )

  if (atlasState.status === 'loading') {
    return (
      <div className="panel shelf-loading" role="status">
        <h2 id={titleId}>{t('journal.title')}</h2>
        <p>{t('panel.loading')}</p>
      </div>
    )
  }

  const model: JournalModel = { atlas, night, experiences, page, goTo, turn, now, titleId, onClose }

  return (
    <>
      {sceneMode && layout && atlas ? <JournalScene model={model} atlas={atlas} layout={layout} /> : <JournalText model={model} />}
      <div className="visually-hidden" aria-live="polite">
        {message}
      </div>
    </>
  )
}
