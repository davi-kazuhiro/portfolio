import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getContent } from '@/content'
import { framesGeometry, stepAward } from '@/ui/closeup/framesAtlas'
import { useViewportSize } from '@/ui/closeup/hooks'
import { HUD_BAND, pickCloseupLayout } from '@/ui/closeup/layout'
import { useFramesAtlas } from '@/ui/closeup/useFramesAtlas'
import { useNightAtOpen } from '@/ui/closeup/useNightAtOpen'
import { FramesScene } from './frames/FramesScene'
import { FramesText } from './frames/FramesText'
import type { FramesModel } from './frames/model'
import { toLocale } from './locale'
import type { PanelProps } from './types'

// Quadros → Prêmios e certificados (specs/7-quadros.md, variação A "galeria de molduras").
// Visão de perto em tela cheia: o certificado aberto na moldura grande e as miniaturas na parede.
// A ilustração cobre a janela (regra cover); sem escala ≥ 3 (celular), modo texto em tela cheia.
export function FramesPanel({ titleId, onClose }: PanelProps) {
  const { t, i18n } = useTranslation()
  const awards = getContent(toLocale(i18n.language)).awards

  const atlasState = useFramesAtlas()
  const atlas = atlasState.status === 'ready' ? atlasState.atlas : null
  const vp = useViewportSize()
  const { night, dusk } = useNightAtOpen()

  const [rawOpen, setOpen] = useState(0)
  const [message, setMessage] = useState('')
  const total = awards.length
  const open = Math.min(rawOpen, Math.max(total - 1, 0))

  const geometry = useMemo(() => (atlas ? framesGeometry(atlas) : null), [atlas])
  const layout = geometry ? pickCloseupLayout(vp.w, vp.h, geometry, HUD_BAND) : null
  const sceneMode = layout !== null && layout.mode === 'cover'

  const goTo = useCallback(
    (i: number) => {
      const next = Math.min(Math.max(i, 0), Math.max(total - 1, 0))
      setOpen(next)
      const award = awards[next]
      if (award) setMessage(t('frames.announce', { current: next + 1, total, title: award.title }))
    },
    [t, total, awards],
  )
  const step = useCallback(
    (dir: 1 | -1) => {
      const next = stepAward(open, dir, total)
      if (next !== open) goTo(next)
    },
    [open, total, goTo],
  )

  if (atlasState.status === 'loading') {
    return (
      <div className="panel shelf-loading" role="status">
        <h2 id={titleId}>{t('frames.title')}</h2>
        <p>{t('panel.loading')}</p>
      </div>
    )
  }

  const model: FramesModel = { atlas, night, dusk, awards, open, goTo, step, titleId, onClose }

  return (
    <>
      {sceneMode && layout && atlas ? <FramesScene model={model} atlas={atlas} layout={layout} /> : <FramesText model={model} />}
      <div className="visually-hidden" aria-live="polite">
        {message}
      </div>
    </>
  )
}
