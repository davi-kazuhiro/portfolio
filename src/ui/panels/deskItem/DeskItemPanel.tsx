import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cycleIndex, deskItemGeometry } from '@/ui/closeup/deskItemAtlas'
import { useViewportSize } from '@/ui/closeup/hooks'
import { HUD_BAND, pickCloseupLayout } from '@/ui/closeup/layout'
import type { DeskItemAtlasState, DeskItemKind } from '@/ui/closeup/useDeskItemAtlas'
import { useNightAtOpen } from '@/ui/closeup/useNightAtOpen'
import type { PanelProps } from '../types'
import { DeskItemScene } from './DeskItemScene'
import { DeskItemText } from './DeskItemText'
import { captionLines, type DeskEntry, type DeskItemModel } from './model'

interface DeskItemPanelProps extends PanelProps {
  ns: DeskItemKind
  atlasState: DeskItemAtlasState
  entries: DeskEntry[]
  /** Linhas da legenda quando o atlas não traz `stage.caption.lines`. */
  defaultLines: string[]
}

// Palco compartilhado do headset (álbuns) e do controle (jogos), specs/8-headset.md e
// 9-controle.md: o objeto 3D desenhado à esquerda e, à direita, o item aberto flutuando com a
// legenda embaixo e setas dos lados. A ilustração cobre a janela (regra cover); sem escala ≥ 3
// possível (telas estreitas) ou sem atlas, modo texto em tela cheia.
export function DeskItemPanel({ titleId, onClose, ns, atlasState, entries, defaultLines }: DeskItemPanelProps) {
  const { t } = useTranslation()
  const atlas = atlasState.status === 'ready' ? atlasState.atlas : null
  const vp = useViewportSize()
  const night = useNightAtOpen()

  const [rawOpen, setOpen] = useState(0)
  const [message, setMessage] = useState('')
  const total = entries.length
  const open = Math.min(rawOpen, Math.max(total - 1, 0))
  const lines = atlas?.stage.lines ?? defaultLines

  const geometry = useMemo(() => (atlas ? deskItemGeometry(atlas) : null), [atlas])
  const layout = geometry ? pickCloseupLayout(vp.w, vp.h, geometry, HUD_BAND) : null
  const sceneMode = layout !== null && layout.mode === 'cover'

  const step = useCallback(
    (dir: 1 | -1) => {
      if (total < 2) return
      const next = cycleIndex(open, dir, total)
      setOpen(next)
      const entry = entries[next]
      setMessage(t(`${ns}.announce`, { label: captionLines(entry, lines).join(', '), current: next + 1, total }))
    },
    [open, total, entries, lines, ns, t],
  )

  if (atlasState.status === 'loading') {
    return (
      <div className="panel shelf-loading" role="status">
        <h2 id={titleId}>{t(`${ns}.title`)}</h2>
        <p>{t('panel.loading')}</p>
      </div>
    )
  }

  const model: DeskItemModel = { ns, atlas, night, entries, lines, open, step, titleId, onClose }

  return (
    <>
      {sceneMode && layout && atlas ? <DeskItemScene model={model} atlas={atlas} layout={layout} /> : <DeskItemText model={model} />}
      <div className="visually-hidden" aria-live="polite">
        {message}
      </div>
    </>
  )
}
